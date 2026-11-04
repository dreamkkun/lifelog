'use client';

import { Pin } from 'lucide-react';
import type { DatabaseRecord } from '@/types/database.types';
import { MAX_PINNED } from '@/hooks/usePinnedIdeas';
import { formatShort } from '@/lib/utils';

interface PinnedIdeasSectionProps {
  items: DatabaseRecord[];
  onUnpin: (record: DatabaseRecord) => void;
}

/** 대시보드 상단 아이디어 핀 보드. 좁은 화면에서는 가로로 넘기고, 넓은 화면에서는 2열로 보인다. */
export default function PinnedIdeasSection({ items, onUnpin }: PinnedIdeasSectionProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pinned-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 fill-fuchsia-600 text-fuchsia-600" aria-hidden />
        <h2 id="pinned-title" className="text-sm font-semibold text-slate-900">
          고정한 아이디어
        </h2>
        <span className="text-xs tabular-nums text-slate-500">
          {items.length}/{MAX_PINNED}
        </span>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
        {items.map((r) => {
          const title = r.memo_title || r.content.split('\n')[0].trim();
          return (
            <li key={r.id} className="w-64 shrink-0 snap-start md:w-auto">
              <article className="relative h-full rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-4 pr-10 shadow-sm">
                <button
                  type="button"
                  onClick={() => onUnpin(r)}
                  aria-label={`${title} 고정 해제`}
                  className="absolute right-2 top-2 rounded-lg p-1.5 text-fuchsia-600 transition-colors hover:bg-fuchsia-100"
                >
                  <Pin className="h-4 w-4 fill-current" />
                </button>
                <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-slate-900">{title}</h3>
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{r.content}</p>
                {r.tags && r.tags.length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <li key={t} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-fuchsia-700">
                        #{t}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2.5 text-xs text-slate-500">{formatShort(r.target_date)}</p>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
