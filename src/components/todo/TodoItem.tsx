'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { TodoItem as Todo } from '@/types/routine.types';
import { cn } from '@/lib/utils';

/** 체크박스 + 텍스트(완료 시 취소선) + 수정·삭제 버튼. 수정은 그 자리에서 입력칸으로 바뀐다. */
export default function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onRemove,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onUpdate: (todo: Todo, text: string) => Promise<boolean>;
  onRemove: (todo: Todo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setDraft(todo.content);
    setEditing(true);
  };

  const save = async () => {
    const text = draft.trim();
    if (busy) return;
    if (!text || text === todo.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const ok = await onUpdate(todo, text);
    setBusy(false);
    if (ok) setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex items-center gap-2 rounded-xl px-1 py-1.5">
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
          disabled={busy}
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
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-xl px-1 py-1.5 transition-colors duration-300 hover:bg-white/70">
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
        onClick={() => onRemove(todo)}
        className="relative rounded p-1 text-slate-500 before:absolute before:-inset-2 before:content-[''] transition-opacity hover:text-rose-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
