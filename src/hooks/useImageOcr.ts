'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { validateImage } from '@/lib/utils';

/** 폰으로 찍은 사진은 수천 px 라 OCR 이 매우 느리다. 긴 변을 이 값으로 줄여서 읽는다. */
const MAX_SIDE = 1800;

async function downscale(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    return blob ?? file;
  } catch {
    return file; // 줄이지 못하면 원본으로 읽는다
  }
}

/** 책 페이지 등을 찍은 사진 줄바꿈은 글이 아니라 지면의 폭 때문이므로, 문단(빈 줄) 단위만 남기고 이어 붙인다. */
export function tidyOcrText(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\u0000')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/\u0000/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export type OcrState = 'IDLE' | 'READING' | 'DONE' | 'ERROR';

/** 사진 한 장의 글자를 읽는다 (Tesseract, 한국어+영어). 사진 자체는 저장하지 않는다. */
export function useImageOcr() {
  const [state, setState] = useState<OcrState>('IDLE');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const runId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // runId 는 DOM ref 가 아니라 실행 세대 카운터이므로 언마운트 시점의 최신 값을 올리는 게 맞다.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runId.current++;
      const w = workerRef.current;
      workerRef.current = null;
      if (w) void w.terminate();
    };
  }, []);

  /** 읽은 글자를 돌려준다. 못 읽었거나 취소되면 null. */
  const recognize = useCallback(async (file: File, opts?: { keepLines?: boolean }): Promise<string | null> => {
    const invalid = validateImage(file);
    if (invalid) {
      setState('ERROR');
      setError(invalid);
      return null;
    }
    const id = ++runId.current;
    const live = () => mounted.current && id === runId.current;
    setState('READING');
    setProgress(0);
    setError(null);

    try {
      const input = await downscale(file);
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('kor+eng', 1, {
        logger: (m) => {
          if (live() && m.status === 'recognizing text') setProgress(Math.min(100, Math.round((m.progress || 0) * 100)));
        },
      });
      workerRef.current = worker;
      let text: string;
      try {
        const { data } = await worker.recognize(input);
        text = data.text;
      } finally {
        if (workerRef.current === worker) workerRef.current = null;
        await worker.terminate();
      }
      if (!live()) return null;
      // 표지처럼 줄 하나하나가 의미 있는 글은 줄바꿈을 그대로 돌려준다
      const tidy = opts?.keepLines ? text.trim() : tidyOcrText(text);
      if (!tidy) {
        setState('ERROR');
        setError('사진에서 글자를 찾지 못했어요. 글자가 크게 나오도록 가까이서 밝게 찍어 보세요.');
        return null;
      }
      setState('DONE');
      return tidy;
    } catch {
      if (live()) {
        setState('ERROR');
        setError('글자를 읽지 못했어요. 잠시 뒤 다시 시도하거나 직접 입력해 주세요.');
      }
      return null;
    }
  }, []);

  return { state, progress, error, recognize, isReading: state === 'READING' };
}
