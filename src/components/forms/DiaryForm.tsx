'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cloud, CloudRain, Loader2, Snowflake, Sun } from 'lucide-react';
import { removeImages, saveRecord } from '@/lib/records';
import { ExistingImages } from '@/components/ui/ExistingImages';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/Toast';
import { cn, todayISO } from '@/lib/utils';
import type { DatabaseRecord, Weather } from '@/types/database.types';

interface DiaryFormProps {
  userId: string;
  defaultDate?: string;
  onSuccess?: () => void;
  /** 있으면 새 기록이 아니라 이 기록을 수정한다 */
  initialRecord?: DatabaseRecord;
}

const weatherOptions: { type: Weather; label: string; icon: React.ReactNode }[] = [
  { type: 'SUNNY', label: '맑음', icon: <Sun className="h-4 w-4 text-amber-500" aria-hidden /> },
  { type: 'CLOUDY', label: '흐림', icon: <Cloud className="h-4 w-4 text-slate-400" aria-hidden /> },
  { type: 'RAINY', label: '비', icon: <CloudRain className="h-4 w-4 text-blue-500" aria-hidden /> },
  { type: 'SNOWY', label: '눈', icon: <Snowflake className="h-4 w-4 text-sky-400" aria-hidden /> },
];

export default function DiaryForm({ userId, defaultDate, onSuccess, initialRecord }: DiaryFormProps) {
  const isEdit = !!initialRecord;
  const router = useRouter();
  const toast = useToast();

  const [targetDate, setTargetDate] = useState(initialRecord?.target_date ?? (defaultDate || todayISO()));
  const [weather, setWeather] = useState<Weather>(initialRecord?.weather ?? 'SUNNY');
  const [content, setContent] = useState(initialRecord?.content ?? '');
  const [images, setImages] = useState<string[]>([]); // 이번에 새로 올린 이미지
  const [keptImages, setKeptImages] = useState<string[]>(initialRecord?.image_urls ?? []); // 수정 시 남겨 둔 기존 이미지
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contentInvalid = submitted && !content.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);
    if (!content.trim()) return;

    setIsSubmitting(true);
    const error = await saveRecord(
      {
        user_id: userId,
        type: 'DIARY',
        target_date: targetDate,
        weather,
        content: content.trim(),
        image_urls: [...keptImages, ...images],
      },
      initialRecord?.id,
    );

    if (error) {
      toast(`일기 ${isEdit ? '수정' : '저장'}에 실패했습니다: ${error}`, 'error');
      setIsSubmitting(false); // 실패 시에만 재시도 허용 (성공 후 이동 중 중복 저장 차단)
      return;
    }
    if (initialRecord) await removeImages(initialRecord.image_urls.filter((p) => !keptImages.includes(p)));
    toast(isEdit ? '일기를 수정했어요.' : '일기를 저장했어요.');
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
      className="w-full space-y-5"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="diary-target-date" className="mb-1 block text-xs font-semibold text-slate-500">
            날짜
          </label>
          <input
            id="diary-target-date"
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex-[1.5]">
          <span id="diary-weather" className="mb-1 block text-xs font-semibold text-slate-500">
            오늘의 날씨
          </span>
          <div
            role="group"
            aria-labelledby="diary-weather"
            className="grid grid-cols-4 gap-1 rounded-lg border border-slate-100 bg-slate-50 p-1"
          >
            {weatherOptions.map((w) => (
              <button
                key={w.type}
                type="button"
                aria-pressed={weather === w.type}
                aria-label={w.label}
                onClick={() => setWeather(w.type)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-all',
                  weather === w.type ? 'bg-white font-bold text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                )}
              >
                {w.icon}
                <span className="hidden sm:inline">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="diary-content" className="mb-1 block text-xs font-semibold text-slate-500">
          오늘의 하루 기록 *
        </label>
        <textarea
          id="diary-content"
          rows={8}
          placeholder="오늘 있었던 특별한 일, 떠오른 생각, 감사한 순간을 기록해 보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={contentInvalid}
          className={cn(
            'w-full rounded-lg border p-3 text-sm leading-relaxed focus:outline-none focus:ring-2',
            contentInvalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-emerald-500',
          )}
        />
        {contentInvalid && <p className="mt-1 text-xs text-rose-600">내용을 입력해주세요.</p>}
      </div>

      <div className="space-y-1">
        <span className="block text-xs font-semibold text-slate-500">사진 (선택)</span>
        <ExistingImages paths={keptImages} onRemove={(p) => setKeptImages(keptImages.filter((x) => x !== p))} />
        <ImageUploader targetDate={targetDate} onChange={setImages} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="저장 중" /> : <span>{isEdit ? '수정 저장' : '일기 저장'}</span>}
      </button>
    </form>
  );
}
