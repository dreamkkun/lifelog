'use client';

import { addDays, format } from 'date-fns';
import type { DatabaseRecord, RecordType } from '@/types/database.types';
import type { TodoItem } from '@/types/routine.types';
import { cn, toISODate, todayISO, TYPE_META } from '@/lib/utils';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ORDER: RecordType[] = ['DIARY', 'BOOK', 'LECTURE'];

/** 한 주(일~토) 띠: 날짜마다 기록 종류 점과 할일 표시 */
export function WeekStrip({
  weekStart,
  selected,
  records,
  todos,
  onSelect,
}: {
  weekStart: Date;
  selected: string;
  records: DatabaseRecord[];
  todos: TodoItem[];
  onSelect: (iso: string) => void;
}) {
  const today = todayISO();
  return (
    <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="이번 주">
      {WEEKDAYS.map((w, i) => {
        const day = addDays(weekStart, i);
        const iso = toISODate(day);
        const types = ORDER.filter((t) => records.some((r) => r.target_date === iso && r.type === t));
        const dayTodos = todos.filter((t) => t.target_date === iso);
        const isSelected = iso === selected;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={isSelected}
            aria-label={`${format(day, 'M월 d일')}${dayTodos.length ? `, 할일 ${dayTodos.length}개` : ''}`}
            className={cn(
              'flex flex-col items-center rounded-2xl py-2 transition-colors',
              isSelected ? 'bg-slate-900 text-slate-300' : 'text-slate-500 hover:bg-slate-100',
              !isSelected && iso === today && 'ring-1 ring-inset ring-slate-300',
              i === 0 && !isSelected && 'text-rose-500',
              i === 6 && !isSelected && 'text-blue-500',
            )}
          >
            <span className="text-[11px]">{w}</span>
            <span className={cn('my-1 text-[17px] font-bold tabular-nums', isSelected ? 'text-white' : 'text-slate-900')}>
              {format(day, 'd')}
            </span>
            <span className="flex h-1.5 items-center gap-0.5">
              {types.map((t) => (
                <span key={t} className={cn('h-1.5 w-1.5 rounded-full', TYPE_META[t].dot)} />
              ))}
              {dayTodos.length > 0 && (
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-sm',
                    dayTodos.every((t) => t.is_completed) ? 'bg-slate-400' : isSelected ? 'bg-white' : 'bg-slate-900',
                  )}
                  title="할일"
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
