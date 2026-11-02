'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, CheckCircle2, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { removeImages, saveRecord } from '@/lib/records';
import { ExistingImages } from '@/components/ui/ExistingImages';
import { useLectureMediaPipeline } from '@/hooks/useLectureMediaPipeline';
import { useToast } from '@/components/ui/Toast';
import { cn, todayISO, validateImage } from '@/lib/utils';
import type { DatabaseRecord } from '@/types/database.types';

interface LectureFormProps {
  userId: string;
  defaultDate?: string;
  onSuccess?: () => void;
  /** 있으면 새 기록이 아니라 이 기록을 수정한다 */
  initialRecord?: DatabaseRecord;
}

const fieldClass = (invalid: boolean) =>
  cn(
    'w-full rounded-lg border p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2',
    invalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-amber-500',
  );

export default function LectureForm({ userId, defaultDate, onSuccess, initialRecord }: LectureFormProps) {
  const isEdit = !!initialRecord;
  const router = useRouter();
  const toast = useToast();
  const fileInputId = useId();

  const [targetDate, setTargetDate] = useState(initialRecord?.target_date ?? (defaultDate || todayISO()));
  const [lectureTitle, setLectureTitle] = useState(initialRecord?.lecture_title ?? '');
  const [speaker, setSpeaker] = useState(initialRecord?.speaker ?? '');
  const [content, setContent] = useState(initialRecord?.content ?? '');
  const [keptImages, setKeptImages] = useState<string[]>(initialRecord?.image_urls ?? []); // 수정 시 남겨 둔 기존 이미지
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [previewLocalUrl, setPreviewLocalUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const {
    stage,
    ocrProgress,
    uploadedImagePath,
    extractedText,
    errorMessage,
    isProcessing,
    processMedia,
    discardUpload,
  } = useLectureMediaPipeline(userId);

  const setPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewLocalUrl(url);
  };
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const applyText = (text: string, mode: 'append' | 'replace') =>
    setContent((prev) => {
      if (mode === 'replace' || !prev.trim()) return `[추출된 강의 텍스트]\n${text}`;
      return `${prev.trimEnd()}\n\n[추출된 강의 텍스트]\n${text}`;
    });

  const handleFile = async (file: File | undefined) => {
    if (!file || isProcessing) return;
    const invalid = validateImage(file);
    if (invalid) {
      toast(invalid, 'error');
      return;
    }
    setPreview(URL.createObjectURL(file)); // 즉시 썸네일

    const { text } = await processMedia(file);
    if (text) applyText(text, 'append');
    else if (text === '') toast('인식된 텍스트가 없습니다', 'warning');
    else toast('텍스트 인식에 실패했어요. 이미지만 저장돼요.', 'warning');
  };

  const removeImage = async () => {
    setPreview(null);
    await discardUpload();
  };

  const titleInvalid = submitted && !lectureTitle.trim();
  const contentInvalid = submitted && !content.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isProcessing) return;
    setSubmitted(true);
    if (!lectureTitle.trim() || !content.trim()) return;
    // 이미지를 골랐는데 Storage 업로드가 실패했다면 DB 생성을 중단한다.
    if (previewLocalUrl && !uploadedImagePath) {
      toast(errorMessage ?? '이미지 업로드가 끝나지 않았어요.', 'error');
      return;
    }

    setIsSubmitting(true);
    const error = await saveRecord(
      {
        user_id: userId,
        type: 'LECTURE',
        target_date: targetDate,
        lecture_title: lectureTitle.trim(),
        speaker: speaker.trim() || null,
        content: content.trim(),
        image_urls: [...keptImages, ...(uploadedImagePath ? [uploadedImagePath] : [])],
        // 새로 추출한 글자가 없으면 기존에 보관한 원본 OCR 텍스트를 그대로 둔다
        ocr_extracted_text: extractedText || initialRecord?.ocr_extracted_text || null,
      },
      initialRecord?.id,
    );

    if (error) {
      toast(`${isEdit ? '수정' : '저장'} 실패: ${error}`, 'error');
      setIsSubmitting(false); // 실패 시에만 재시도 허용 (성공 시 이동 중 중복 저장 차단)
      return;
    }
    if (initialRecord) await removeImages(initialRecord.image_urls.filter((p) => !keptImages.includes(p)));
    toast(isEdit ? '강의 노트를 수정했어요.' : '강의 노트를 저장했어요.');
    if (onSuccess) onSuccess();
    else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full space-y-6"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="target-date" className="mb-1 block text-xs font-semibold text-slate-500">
            강의 날짜
          </label>
          <input
            id="target-date"
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lecture-title" className="mb-1 block text-xs font-semibold text-slate-500">
            강의명 / 세미나 주제 *
          </label>
          <input
            id="lecture-title"
            type="text"
            placeholder="예: 실무 머신러닝 최적화 기법"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            aria-invalid={titleInvalid}
            className={fieldClass(titleInvalid)}
          />
          {titleInvalid && <p className="mt-1 text-xs text-rose-600">강의명을 입력해주세요.</p>}
        </div>
      </div>

      <div>
        <label htmlFor="speaker" className="mb-1 block text-xs font-semibold text-slate-500">
          강사 / 연사
        </label>
        <input
          id="speaker"
          type="text"
          placeholder="예: 김교수 / 홍길동 엔지니어"
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
          className={fieldClass(false)}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-semibold text-slate-500">슬라이드 / 필기 사진</span>
        <ExistingImages paths={keptImages} onRemove={(p) => setKeptImages(keptImages.filter((x) => x !== p))} />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'rounded-xl border-2 border-dashed p-4 text-center transition-colors',
            dragging ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50/50 hover:border-amber-400',
          )}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2 py-2" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" aria-hidden />
              <div className="text-xs font-medium text-slate-700">
                {stage === 'OCR_PROCESSING' && `문서 텍스트 인식 중 (${ocrProgress}%)`}
                {stage === 'STORAGE_UPLOADING' && '클라우드 스토리지 안전 보관 중...'}
              </div>
              {stage === 'OCR_PROCESSING' && (
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-amber-500 transition-all duration-200" style={{ width: `${ocrProgress}%` }} />
                </div>
              )}
            </div>
          ) : previewLocalUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewLocalUrl} alt="선택한 사진 미리보기" className="max-h-48 rounded-lg object-contain" />
                <button
                  type="button"
                  aria-label="사진 제거"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-1 text-white hover:bg-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {uploadedImagePath && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> 스토리지 업로드 및 분석 완료
                </div>
              )}
              <label htmlFor={fileInputId} className="cursor-pointer text-[11px] text-slate-500 underline">
                다른 사진으로 변경
              </label>
            </div>
          ) : (
            <label htmlFor={fileInputId} className="flex cursor-pointer flex-col items-center space-y-1 py-2">
              <span className="mb-1 rounded-full bg-amber-50 p-2.5 text-amber-600">
                <UploadCloud className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-xs font-semibold text-slate-700">사진을 끌어놓거나 눌러서 선택</span>
              <span className="text-[11px] text-slate-400">JPG·PNG·WEBP, 10MB 이하 · 텍스트를 판독해 본문에 자동 추가해요</span>
            </label>
          )}
          <input
            type="file"
            id={fileInputId}
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isProcessing}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {!isProcessing && !previewLocalUrl && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 md:hidden">
              <Camera className="h-4 w-4" aria-hidden /> 카메라로 촬영
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="content" className="block text-xs font-semibold text-slate-500">
            강의 메모 / 필기 요약 *
          </label>
          {extractedText && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <FileText className="h-3.5 w-3.5" aria-hidden /> OCR 추출 텍스트 자동 삽입됨
            </span>
          )}
        </div>
        <textarea
          id="content"
          rows={8}
          placeholder="핵심 인사이트나 필기 내용을 작성하세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={contentInvalid}
          className={cn(fieldClass(contentInvalid), 'font-mono leading-relaxed')}
        />
        {contentInvalid && <p className="mt-1 text-xs text-rose-600">강의 메모를 입력해주세요.</p>}
        {extractedText && (
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => applyText(extractedText, 'append')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              본문에 이어붙이기
            </button>
            <button
              type="button"
              onClick={() => applyText(extractedText, 'replace')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              본문 덮어쓰기
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isProcessing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 동기화 저장 중...
          </>
        ) : (
          isEdit ? '수정 저장' : '강의 노트 저장'
        )}
      </button>
    </form>
  );
}
