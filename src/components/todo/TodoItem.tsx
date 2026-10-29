'use client';

import { Check, Trash2 } from 'lucide-react';
import type { TodoItem as Todo } from '@/types/routine.types';
import { cn } from '@/lib/utils';

/** 체크박스 + 텍스트(완료 시 취소선) + 호버 시 보이는 삭제 버튼 */
export default function TodoItem({
  todo,
  onToggle,
  onRemove,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onRemove: (todo: Todo) => void;
}) {
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
            todo.is_completed ? 'select-none text-slate-400 line-through decoration-slate-300' : 'font-medium text-slate-800',
          )}
        >
          {todo.content}
        </span>
      </button>
      <button
        type="button"
        aria-label={`${todo.content} 삭제`}
        onClick={() => onRemove(todo)}
        className="rounded p-1 text-slate-300 transition-opacity hover:text-rose-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
