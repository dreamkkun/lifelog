'use client';

import { useState } from 'react';
import { Check, Pencil, Repeat, Trash2, X } from 'lucide-react';
import type { RepeatRule, TodoItem as Todo, Weekday } from '@/types/routine.types';
import { parseISO } from 'date-fns';
import RepeatPicker, { toRule, type RepeatMode } from './RepeatPicker';
import { cn } from '@/lib/utils';

/** 체크박스 + 텍스트(완료 시 취소선) + 수정·삭제 버튼. 수정은 그 자리에서 입력칸으로 바뀐다. */
export default function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onRemove,
  onSkipOnce,
  onStopRepeat,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  /** repeat 가 있으면 이 한 번짜리 할일을 그 반복으로 바꾼다 */
  onUpdate: (todo: Todo, text: string, repeat: RepeatRule | null) => Promise<boolean>;
  onRemove: (todo: Todo) => void;
  /** 반복 할일: 이 날 항목만 삭제 */
  onSkipOnce: (todo: Todo) => Promise<void>;
  /** 반복 할일: 이 날부터 반복 멈추기 */
  onStopRepeat: (todo: Todo) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<RepeatMode>('ONCE');
  const [weekdays, setWeekdays] = useState<Weekday[]>([parseISO(todo.target_date).getDay() as Weekday]);
  const [choosing, setChoosing] = useState(false); // 반복 할일 삭제 방식 고르기

  const canRepeat = !todo.template_id; // 이미 반복인 항목은 이 자리에서 반복 규칙을 바꾸지 않는다
  const rule = toRule(mode, weekdays);
  const needsWeekday = mode === 'WEEKLY' && weekdays.length === 0;

  const startEdit = () => {
    setDraft(todo.content);
    setMode('ONCE');
    setWeekdays([parseISO(todo.target_date).getDay() as Weekday]);
    setEditing(true);
  };

  const save = async () => {
    const text = draft.trim();
    if (busy || needsWeekday) return;
    if (!text || (text === todo.content && !rule)) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const ok = await onUpdate(todo, text, rule);
    setBusy(false);
    if (ok) setEditing(false);
  };

  const choose = async (action: (t: Todo) => Promise<void>) => {
    setBusy(true);
    await action(todo);
    setBusy(false);
    setChoosing(false);
  };

  if (editing) {
    return (
      <li className="space-y-2 rounded-xl px-1 py-1.5">
        <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          maxLength={200}
          aria-label="할일 수정"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              save();
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-slate-500"
        />
        <button
          type="button"
          aria-label="수정 저장"
          disabled={busy || needsWeekday}
          onClick={save}
          className="rounded p-2.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="수정 취소"
          onClick={() => setEditing(false)}
          className="rounded p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
        </div>
        {canRepeat && <RepeatPicker mode={mode} weekdays={weekdays} onModeChange={setMode} onWeekdaysChange={setWeekdays} />}
      </li>
    );
  }

  return (
    <li className="rounded-xl transition-colors duration-300 hover:bg-white/70">
    <div className="group flex items-center gap-3 px-1 py-1.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.is_completed}
        aria-label={todo.content}
        onClick={() => onToggle(todo)}
        className="flex min-w-0 flex-1 cursor-pointer select-none items-center gap-3 text-left"
      >
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
            todo.is_completed
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white group-hover:border-slate-500',
          )}
        >
          {todo.is_completed && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
        </span>
        <span
          className={cn(
            'break-words text-sm leading-snug transition-colors duration-300',
            todo.is_completed ? 'select-none text-slate-500 line-through decoration-slate-300' : 'font-medium text-slate-800',
          )}
        >
          {todo.content}
        </span>
        {todo.template_id && <Repeat className="h-3 w-3 shrink-0 text-slate-500" aria-label="반복 할일" />}
      </button>
      <button
        type="button"
        aria-label={`${todo.content} 수정`}
        onClick={startEdit}
        className="relative rounded p-1 text-slate-500 before:absolute before:-inset-2 before:content-[''] transition-opacity hover:text-slate-700 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`${todo.content} 삭제`}
        onClick={() => (todo.template_id ? setChoosing((v) => !v) : onRemove(todo))}
        className="relative rounded p-1 text-slate-500 before:absolute before:-inset-2 before:content-[''] transition-opacity hover:text-rose-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
    {choosing && (
      <div role="group" aria-label="반복 할일 삭제 방식" className="mx-1 mb-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs leading-relaxed text-slate-600">반복 할일이에요. 어떻게 지울까요?</p>
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(onSkipOnce)}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
          >
            이 날만 삭제
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(onStopRepeat)}
            className="min-h-11 flex-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
          >
            이 날부터 반복 멈추기
          </button>
          <button
            type="button"
            onClick={() => setChoosing(false)}
            className="min-h-11 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            취소
          </button>
        </div>
        <p className="text-xs text-slate-500">&lsquo;이 날만 삭제&rsquo;는 다른 날의 반복은 그대로 두고, 습관 기록에서도 이 날은 빼고 세요.</p>
      </div>
    )}
    </li>
  );
}
