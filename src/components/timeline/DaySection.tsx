'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import type { DatabaseRecord } from '@/types/database.types';
import type { TodoItem } from '@/types/routine.types';
import DailyTodoList from '@/components/todo/DailyTodoList';
import { TimelineEntry } from '@/components/timeline/TimelineEntry';
import { todayISO } from '@/lib/utils';

export interface TodoActions {
  addTodo: (date: string, text: string) => Promise<string | null>;
  toggleTodo: (id: string, done: boolean) => Promise<string | null>;
  updateTodo: (id: string, content: string) => Promise<string | null>;
  removeTodo: (id: string) => Promise<string | null>;
}

/** 하루치 묶음: 날짜 머리글 + 할일 + 그날의 기록들 */
export function DaySection({
  date,
  records,
  todos,
  showTodos,
  showRecords,
  todoActions,
  onDeleteRecord,
  onTogglePin,
}: {
  date: string;
  records: DatabaseRecord[];
  todos: TodoItem[];
  showTodos: boolean;
  showRecords: boolean;
  todoActions: TodoActions;
  onDeleteRecord: (r: DatabaseRecord) => void;
  onTogglePin?: (r: DatabaseRecord) => void;
}) {
  const d = parseISO(date);
  const isToday = date === todayISO();
  const empty = (!showRecords || records.length === 0) && (!showTodos || todos.length === 0);

  return (
    <section id={`day-${date}`} aria-label={format(d, 'M월 d일', { locale: ko })} className="scroll-mt-44 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-3xl font-semibold leading-none tabular-nums text-slate-900">{format(d, 'd')}</span>
        <span className="text-sm text-slate-500">{format(d, 'M월 EEEE', { locale: ko })}</span>
        {isToday && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">오늘</span>}
        {showRecords && (
          <Link
            href={`/new?type=diary&date=${date}`}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> 기록 남기기
          </Link>
        )}
      </div>

      {showTodos && (
        <DailyTodoList
          date={date}
          todos={todos}
          isToday={isToday}
          onAdd={todoActions.addTodo}
          onToggle={todoActions.toggleTodo}
          onUpdate={todoActions.updateTodo}
          onRemove={todoActions.removeTodo}
        />
      )}

      {showRecords && records.length > 0 && (
        <div className="space-y-6">
          {records.map((r) => (
            <TimelineEntry key={r.id} record={r} onDelete={onDeleteRecord} onTogglePin={onTogglePin} />
          ))}
        </div>
      )}

      {empty && !showTodos && (
        <p className="py-4 text-sm text-slate-400">이 날은 비어 있어요. 한 줄만 남겨도 달력에 표시돼요.</p>
      )}
    </section>
  );
}
