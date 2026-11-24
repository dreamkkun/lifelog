'use client';

import { Repeat } from 'lucide-react';
import type { RepeatRule, Weekday } from '@/types/routine.types';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export type RepeatMode = 'ONCE' | 'DAILY' | 'WEEKLY';

const MODES: { value: RepeatMode; label: string }[] = [
  { value: 'ONCE', label: '반복 안 함' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '요일별' },
];

export function toRule(mode: RepeatMode, weekdays: Weekday[]): RepeatRule | null {
  return mode === 'DAILY' ? { type: 'DAILY' } : mode === 'WEEKLY' ? { type: 'WEEKLY', weekdays } : null;
}

/** 이미 있는 할일에 반복을 붙일 때 쓰는 선택기: 반복 안 함 / 매일 / 요일별(요일 고르기). */
export default function RepeatPicker({
  mode,
  weekdays,
  onModeChange,
  onWeekdaysChange,
}: {
  mode: RepeatMode;
  weekdays: Weekday[];
  onModeChange: (mode: RepeatMode) => void;
  onWeekdaysChange: (weekdays: Weekday[]) => void;
}) {
  const toggleDay = (d: Weekday) =>
    onWeekdaysChange(weekdays.includes(d) ? weekdays.filter((x) => x !== d) : [...weekdays, d].sort((a, b) => a - b));

  return (
    <div className="space-y-2">
      <div role="group" aria-label="반복 설정" className="flex flex-wrap items-center gap-1.5">
        <Repeat className="h-3.5 w-3.5 text-slate-500" aria-hidden />
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mode === m.value}
            onClick={() => onModeChange(m.value)}
            className={cn(
              'min-h-8 rounded-full border px-3 text-xs font-semibold transition-colors',
              mode === m.value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'WEEKLY' && (
        <div role="group" aria-label="반복할 요일" className="flex gap-1.5">
          {WEEKDAY_LABELS.map((label, i) => {
            const d = i as Weekday;
            const on = weekdays.includes(d);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={cn(
                  'h-9 min-w-9 flex-1 rounded-lg border text-xs font-semibold transition-colors',
                  on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {mode === 'WEEKLY' && weekdays.length === 0 && <p className="text-xs text-rose-600">반복할 요일을 하나 이상 골라 주세요.</p>}
      {mode !== 'ONCE' && !(mode === 'WEEKLY' && weekdays.length === 0) && (
        <p className="text-xs text-slate-500">이 날부터 {mode === 'DAILY' ? '매일' : '고른 요일마다'} 자동으로 추가돼요.</p>
      )}
    </div>
  );
}
