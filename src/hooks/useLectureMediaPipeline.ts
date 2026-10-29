'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { createClient } from '@/lib/supabase/client';
import { validateImage } from '@/lib/utils';
import type { PipelineResult, PipelineState } from '@/types/lecture';

const STORAGE_BUCKET = 'record-images';

const INITIAL: PipelineState = {
  stage: 'IDLE',
  ocrProgress: 0,
  uploadedImagePath: null,
  extractedText: null,
  errorMessage: null,
};

export function useLectureMediaPipeline(userId: string) {
  const [state, setState] = useState<PipelineState>(INITIAL);
  const workerRef = useRef<TesseractWorker | null>(null);
  const uploadedPathRef = useRef<string | null>(null);
  const runId = useRef(0);
  const mounted = useRef(true);

  const stopWorker = useCallback(() => {
    const w = workerRef.current;
    workerRef.current = null;
    if (w) void w.terminate();
  }, []);

  // 언마운트 시 진행 중인 Worker 를 명시적으로 종료
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // runId 는 DOM ref 가 아니라 실행 세대 카운터이므로 언마운트 시점의 최신 값을 올리는 게 맞다.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runId.current++;
      stopWorker();
    };
  }, [stopWorker]);

  const resetPipeline = useCallback(() => {
    runId.current++; // 진행 중이던 작업의 결과는 버린다
    stopWorker();
    setState(INITIAL);
  }, [stopWorker]);

  /** 이미 올라간 이미지를 Storage 에서 지우고 파이프라인을 초기화한다. */
  const discardUpload = useCallback(async () => {
    const path = uploadedPathRef.current;
    uploadedPathRef.current = null;
    resetPipeline();
    if (path) await createClient().storage.from(STORAGE_BUCKET).remove([path]);
  }, [resetPipeline]);

  const processMedia = useCallback(
    async (file: File): Promise<PipelineResult> => {
      const none: PipelineResult = { imagePath: null, text: null };

      const invalid = validateImage(file);
      if (invalid) {
        setState((prev) => ({ ...prev, stage: 'ERROR', errorMessage: invalid }));
        return none;
      }

      // 이전 업로드/작업 정리 후 새 실행 시작
      const previousPath = uploadedPathRef.current;
      uploadedPathRef.current = null;
      stopWorker();
      const id = ++runId.current;
      const live = () => mounted.current && id === runId.current;
      setState({ ...INITIAL, stage: 'OCR_PROCESSING' });

      const supabase = createClient();
      if (previousPath) void supabase.storage.from(STORAGE_BUCKET).remove([previousPath]);

      // 1단계: OCR. 엔진 오류는 치명적이지 않으므로 text=null 로 두고 업로드를 계속한다.
      let text: string | null = null;
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('kor+eng', 1, {
          logger: (m) => {
            if (live() && m.status === 'recognizing text') {
              setState((prev) => ({
                ...prev,
                ocrProgress: Math.min(100, Math.max(0, Math.round((m.progress || 0) * 100))),
              }));
            }
          },
        });
        workerRef.current = worker;
        try {
          const { data } = await worker.recognize(file);
          text = data.text.trim();
        } finally {
          if (workerRef.current === worker) workerRef.current = null;
          await worker.terminate();
        }
      } catch {
        text = null;
      }
      if (!live()) return none;

      // 2단계: Storage 업로드
      setState((prev) => ({ ...prev, stage: 'STORAGE_UPLOADING', ocrProgress: 100, extractedText: text || null }));

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${userId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

      if (!live()) {
        if (!error) void supabase.storage.from(STORAGE_BUCKET).remove([path]);
        return none;
      }
      if (error) {
        setState((prev) => ({
          ...prev,
          stage: 'ERROR',
          errorMessage: `Storage 업로드 실패: ${error.message}`,
        }));
        return { imagePath: null, text }; // 추출 텍스트는 살려 둔다
      }

      uploadedPathRef.current = path;
      setState({
        stage: 'COMPLETED',
        ocrProgress: 100,
        uploadedImagePath: path,
        extractedText: text || null,
        errorMessage: null,
      });
      return { imagePath: path, text };
    },
    [userId, stopWorker],
  );

  return {
    ...state,
    processMedia,
    resetPipeline,
    discardUpload,
    isProcessing: state.stage === 'OCR_PROCESSING' || state.stage === 'STORAGE_UPLOADING',
  };
}
