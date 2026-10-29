'use client';

import { useMemo } from 'react';
import { getDay, getDaysInMonth, format } from 'date-fns';
import type { DatabaseRecord, RecordType } from '@/types/database.types';
import { cn, todayISO, TYPE_META } from '@/lib/utils';

const WEEKDAYS = [
  { label: '일', cls: 'text-rose-500' },
  { label: '월', cls: 'text-slate-400' },
  { label: '화', cls: 'text-slate-400' },
  { label: '수', cls: 'text-slate-400' },
  { label: '목', cls: 'text-slate-400' },
  { label: '금', cls: 'text-slate-400' },
  { label: '토', cls: 'text-blue-500' },
];
const ORDER: RecordType[] = ['DIARY', 'BOOK', 'LECTURE'];
const MAX_SNIPPETS = 3;

/** 달력 칸에 보여줄 한 줄: 일기는 첫 문장, 독서/강의는 제목 */
function snippet(r: DatabaseRecord): string {
  if (r.type === 'BOOK') return r.book_title || r.content;
  if (r.type === 'LECTURE') return r.lecture_title || r.content;
  return r.content.split('\n')[0].trim();
}

export interface TodoStat {
  done: number;
  total: number;
}

/** 월간 달력 격자 (제목/이동은 상위 헤더가 맡는다) */
export function MonthlyCalendar({
  month,
  records,
  todoStats,
  selected,
  isLoading,
  onSelect,
}: {
  month: Date; // 해당 월의 1일
  records: DatabaseRecord[];
  todoStats: Map<string, TodoStat>;
  selected: string | null;
  isLoading: boolean;
  onSelect: (iso: string) => void;
}) {
  // 날짜 → 그날의 기록들 (입력 순서 유지)
  const byDate = useMemo(() => {
    const map = new Map<string, DatabaseRecord[]>();
    for (const r of records) {
      const list = map.get(r.target_date);
      if (list) list.push(r);
      else map.set(r.target_date, [r]);
    }
    return map;
  }, [records]);

  const leading = getDay(month);
  const days = getDaysInMonth(month);
  const trailing = (7 - ((leading + days) % 7)) % 7;
  const today = todayISO();
  const ym = format(month, 'yyyy-MM');
  const blank = <div className="h-16 bg-slate-50 sm:h-24" />;

  return (
    <section aria-label="월간 캘린더">
      <div className="grid grid-cols-7 pb-1.5 text-center text-xs font-semibold">
        {WEEKDAYS.map((w) => (
          <span key={w.label} className={w.cls}>
            {w.label}
          </span>
        ))}
      </div>

      {/* 장부처럼 칸을 헤어라인으로 이어 붙인다 */}
      <div
        className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200"
        aria-busy={isLoading}
      >
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`b${i}`}>{blank}</div>
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const iso = `${ym}-${String(i + 1).padStart(2, '0')}`;
          const items = byDate.get(iso) ?? [];
          const stat = todoStats.get(iso);
          const types = ORDER.filter((t) => items.some((r) => r.type === t));
          const isSelected = selected === iso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              aria-label={`${iso}${items.length ? `, 기록 ${items.length}건` : ''}${stat ? `, 할일 ${stat.done}/${stat.total}` : ''}`}
              className={cn(
                'flex h-16 min-w-0 flex-col items-stretch gap-1 p-1.5 text-left transition-colors sm:h-24',
                isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50',
                iso === today && 'ring-2 ring-inset ring-slate-400',
              )}
            >
              <span className="flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums">{i + 1}</span>
                {stat && (
                  <span className={cn('text-[10px] tabular-nums', isSelected ? 'text-white/70' : 'text-slate-400')}>
                    ☑ {stat.done}/{stat.total}
                  </span>
                )}
              </span>

              {isLoading ? (
                <span className="h-1.5 w-6 animate-pulse rounded-full bg-slate-200" />
              ) : (
                <>
                  {/* 좁은 화면: 유형당 점 1개 */}
                  <span className="flex gap-1 sm:hidden">
                    {types.map((t) => (
                      <span key={t} className={cn('h-1.5 w-1.5 rounded-full', TYPE_META[t].dot)} />
                    ))}
                  </span>
                  {/* 넓은 화면: 기록마다 점 + 한 줄 미리보기 */}
                  <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    {items.slice(0, MAX_SNIPPETS).map((r) => (
                      <span key={r.id} className="flex min-w-0 items-center gap-1">
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TYPE_META[r.type].dot)} />
                        <span className={cn('truncate text-[10px] leading-4', isSelected ? 'text-white/80' : 'text-slate-500')}>
                          {snippet(r)}
                        </span>
                      </span>
                    ))}
                    {items.length > MAX_SNIPPETS && (
                      <span className={cn('text-[10px]', isSelected ? 'text-white/60' : 'text-slate-400')}>
                        +{items.length - MAX_SNIPPETS}
                      </span>
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
        {Array.from({ length: trailing }).map((_, i) => (
          <div key={`t${i}`}>{blank}</div>
        ))}
      </div>
    </section>
  );
}
