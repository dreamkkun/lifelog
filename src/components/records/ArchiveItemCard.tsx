'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Pin, Trash2 } from 'lucide-react';
import type { DatabaseRecord } from '@/types/database.types';
import { useSignedUrls } from '@/hooks/useStorageUpload';
import { Modal } from '@/components/ui/Modal';
import { cn, TYPE_META, WEATHER_META } from '@/lib/utils';

/** 아카이브 한 항목: 왼쪽 날짜 칸 + 유형 색 선이 붙은 본문. 항목 사이는 헤어라인으로만 나눈다. */
export function ArchiveItemCard({ item, onDelete }: { item: DatabaseRecord; onDelete: (r: DatabaseRecord) => void }) {
  const meta = TYPE_META[item.type];
  const urls = useSignedUrls(item.image_urls);
  const [zoom, setZoom] = useState<string | null>(null);
  const d = parseISO(item.target_date);
  const weather = item.type === 'DIARY' && item.weather ? WEATHER_META[item.weather] : null;

  return (
    <article className="flex gap-4 border-b border-slate-200 py-6 sm:gap-6">
      <time dateTime={item.target_date} className="w-12 shrink-0 text-center sm:w-16">
        <span className="block font-serif text-3xl font-semibold leading-none tabular-nums text-slate-900">
          {format(d, 'd')}
        </span>
        <span className="mt-1.5 block text-[11px] text-slate-500">{format(d, 'yyyy.M')}</span>
        <span className="block text-[11px] text-slate-400">{format(d, 'EEE', { locale: ko })}</span>
      </time>

      <div className={cn('min-w-0 flex-1 space-y-2 border-l-2 pl-4', meta.rule)}>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('font-semibold', meta.text)}>{meta.label}</span>
          {weather && (
            <span className="flex items-center gap-1 text-slate-500">
              <weather.Icon className="h-3.5 w-3.5" aria-hidden /> {weather.label}
            </span>
          )}
          {item.ocr_extracted_text && <span className="text-slate-400">사진 글자 인식됨</span>}
          {item.type === 'MEMO' && item.is_pinned && (
            <span className="flex items-center gap-1 text-fuchsia-600">
              <Pin className="h-3.5 w-3.5 fill-current" aria-hidden /> 고정됨
            </span>
          )}
          <button
            type="button"
            aria-label="기록 영구 삭제"
            onClick={() => window.confirm('이 기록을 영구 삭제하시겠습니까?') && onDelete(item)}
            className="ml-auto rounded p-1 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {item.type === 'BOOK' && item.book_title && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="font-serif text-lg font-semibold text-slate-900">{item.book_title}</h3>
            <span className="text-xs text-slate-500">
              {[item.book_author, item.page_number ? `p.${item.page_number}` : null].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {item.type === 'MEMO' && item.memo_title && (
          <h3 className="font-serif text-lg font-semibold text-slate-900">{item.memo_title}</h3>
        )}

        {item.type === 'LECTURE' && item.lecture_title && (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="font-serif text-lg font-semibold text-slate-900">{item.lecture_title}</h3>
            {item.speaker && <span className="text-xs text-slate-500">{item.speaker}</span>}
          </div>
        )}

        {item.type === 'BOOK' && item.quote && (
          <blockquote className="rounded-r-lg border-l-2 border-indigo-400 bg-indigo-50 p-3 font-serif text-[15px] leading-relaxed text-indigo-950">
            &ldquo;{item.quote}&rdquo;
          </blockquote>
        )}

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.content}</p>

        {item.tags && item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <li key={t} className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-medium text-fuchsia-700">
                #{t}
              </li>
            ))}
          </ul>
        )}

        {item.image_urls?.length > 0 && (
          <ul className={cn('pt-1', item.type === 'LECTURE' ? 'grid grid-cols-3 gap-2 sm:grid-cols-4' : 'flex gap-2 overflow-x-auto')}>
            {item.image_urls.map((p) => (
              <li
                key={p}
                className={cn(
                  'overflow-hidden rounded-lg border border-slate-200 bg-slate-100',
                  item.type === 'LECTURE' ? 'aspect-square' : 'h-20 w-20 shrink-0',
                )}
              >
                {urls[p] && (
                  <button type="button" onClick={() => setZoom(urls[p])} aria-label="이미지 크게 보기" className="h-full w-full">
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
