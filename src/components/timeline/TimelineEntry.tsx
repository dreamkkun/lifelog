'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { DatabaseRecord } from '@/types/database.types';
import { useSignedUrls } from '@/hooks/useStorageUpload';
import { Modal } from '@/components/ui/Modal';
import { cn, TYPE_META, WEATHER_META } from '@/lib/utils';

/** 타임라인의 기록 한 건: 왼쪽 유형 배지 + 본문 */
export function TimelineEntry({ record, onDelete }: { record: DatabaseRecord; onDelete?: (r: DatabaseRecord) => void }) {
  const meta = TYPE_META[record.type];
  const urls = useSignedUrls(record.image_urls);
  const [zoom, setZoom] = useState<string | null>(null);
  const weather = record.weather ? WEATHER_META[record.weather] : null;

  const title =
    record.type === 'BOOK' ? record.book_title : record.type === 'LECTURE' ? record.lecture_title : null;
  const sub =
    record.type === 'BOOK'
      ? [record.book_author, record.page_number ? `p.${record.page_number}` : null]
      : record.type === 'LECTURE'
        ? [record.speaker]
        : [];
  const subText = sub.filter(Boolean).join(' · ');
  const time = new Date(record.created_at).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

  return (
    <article className="grid grid-cols-[36px_1fr] gap-3.5">
      <span
        className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-extrabold', meta.badge)}
        aria-hidden
      >
        {meta.short}
      </span>
      <div className="min-w-0 space-y-1.5">
        {title && <h3 className="font-serif text-[17px] font-semibold leading-snug text-slate-900">{title}</h3>}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cn('font-semibold', meta.text)}>{meta.label}</span>
          <span>{time}</span>
          {subText && <span className="truncate">{subText}</span>}
          {weather && (
            <span className="flex shrink-0 items-center gap-1">
              <weather.Icon className="h-3.5 w-3.5" aria-hidden /> {weather.label}
            </span>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="기록 삭제"
              onClick={() => window.confirm('이 기록을 삭제하시겠습니까?') && onDelete(record)}
              className="ml-auto shrink-0 rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {record.quote && (
          <blockquote className="rounded-xl bg-indigo-50 px-3.5 py-2.5 font-serif text-[15px] leading-relaxed text-indigo-950">
            &ldquo;{record.quote}&rdquo;
          </blockquote>
        )}
        {record.content && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{record.content}</p>
        )}
        {record.image_urls?.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto pt-1">
            {record.image_urls.map((p) => (
              <li key={p} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                {urls[p] && (
                  <button type="button" onClick={() => setZoom(urls[p])} className="h-full w-full" aria-label="이미지 크게 보기">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[p]} alt="첨부 이미지" loading="lazy" className="h-full w-full object-cover hover:opacity-90" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal open={!!zoom} onClose={() => setZoom(null)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {zoom && <img src={zoom} alt="원본 이미지" className="max-h-[90vh] max-w-full rounded-lg object-contain" />}
      </Modal>
    </article>
  );
}
