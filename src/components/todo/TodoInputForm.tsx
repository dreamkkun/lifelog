'use client';

import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import type { RepeatRule, Weekday } from '@/types/routine.types';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
type Mode = 'ONCE' | 'DAILY' | 'WEEKLY';

const MODES: { value: Mode; label: string }[] = [
  { value: 'ONCE', label: '한 번만' },
  { value: 'DAILY', label: '매일' },
  { value: 'WEEKLY', label: '요일별' },
];

/** Enter 로 바로 추가되는 인라인 입력. 공백만 입력하면 무시한다. 매일/요일별 반복을 고를 수 있다. */
export default function TodoInputForm({
  id,
  placeholder,
  defaultWeekday,
  onSubmit,
}: {
  id: string;
  placeholder: string;
  /** 요일별을 처음 고를 때 미리 체크해 둘 요일(보고 있는 날짜의 요일) */
  defaultWeekday: Weekday;
  /** 실패하면 입력을 남겨 두기 위해 성공 여부를 돌려준다 */
  onSubmit: (text: string, repeat: RepeatRule | null) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('ONCE');
  const [weekdays, setWeekdays] = useState<Weekday[]>([defaultWeekday]);

  const needsWeekday = mode === 'WEEKLY' && weekdays.length === 0;

  const toggleDay = (d: Weekday) =>
    setWeekdays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy || needsWeekday) return;
    const repeat: RepeatRule | null =
      mode === 'DAILY' ? { type: 'DAILY' } : mode === 'WEEKLY' ? { type: 'WEEKLY', weekdays } : null;
    setBusy(true);
    const ok = await onSubmit(value, repeat);
    setBusy(false);
    if (ok) {
      setText('');
      setMode('ONCE'); // 반복은 한 번 만들면 끝이라 다음 입력은 기본(한 번만)으로 돌린다
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          할일 추가
        </label>
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={200}
          className="min-w-0 flex-1 min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          disabled={!text.trim() || busy || needsWeekday}
          aria-label="할일 추가"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-opacity hover:bg-slate-800 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div role="group" aria-label="반복 설정" className="flex flex-wrap items-center gap-1.5">
        <Repeat className="h-3.5 w-3.5 text-slate-500" aria-hidden />
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mode === m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'min-h-8 rounded-full border px-3 text-xs font-semibold transition-colors',
              mode === m.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
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
      {mode === 'WEEKLY' && needsWeekday && <p className="text-xs text-rose-600">반복할 요일을 하나 이상 골라 주세요.</p>}
      {mode !== 'ONCE' && !needsWeekday && (
        <p className="text-xs text-slate-500">
          {mode === 'DAILY' ? '이 날부터 매일 자동으로 추가돼요.' : '이 날부터 고른 요일마다 자동으로 추가돼요.'}
        </p>
      )}
    </form>
  );
}
