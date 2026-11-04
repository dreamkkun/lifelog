'use client';

import { useToast } from '@/components/ui/Toast';
import type { TodoItem as Todo } from '@/types/routine.types';
import TodoItem from './TodoItem';
import TodoInputForm from './TodoInputForm';

interface DailyTodoListProps {
  date: string;
  todos: Todo[];
  isToday: boolean;
  onAdd: (date: string, text: string) => Promise<string | null>;
  onToggle: (id: string, completed: boolean) => Promise<string | null>;
  onUpdate: (id: string, content: string) => Promise<string | null>;
  onRemove: (id: string) => Promise<string | null>;
}

/** 선택한 날짜의 할일: 진행률, 미완료(위)/완료(아래) 정렬, 체크·삭제·추가 */
export default function DailyTodoList({ date, todos, isToday, onAdd, onToggle, onUpdate, onRemove }: DailyTodoListProps) {
  const toast = useToast();
  const completed = todos.filter((t) => t.is_completed).length;
  // 미완료가 위, 완료가 아래. 같은 그룹 안에서는 입력 순서.
  const sorted = [...todos].sort((a, b) => Number(a.is_completed) - Number(b.is_completed));

  const fail = (what: string, err: string | null) => {
    if (err) toast(`${what}: ${err}`, 'error');
  };

  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{isToday ? '오늘의 할일' : '할일'}</h3>
        {todos.length > 0 && (
          <>
            <span className="text-xs tabular-nums text-slate-500">
              {todos.length}개 중 {completed}개 완료
            </span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200" aria-hidden>
              <span
                className="block h-full bg-slate-900 transition-all duration-500"
                style={{ width: `${(completed / todos.length) * 100}%` }}
              />
            </span>
          </>
        )}
      </div>

      {sorted.length > 0 && (
        <ul className="mb-2">
          {sorted.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={async (x) => fail('체크하지 못했어요', await onToggle(x.id, !x.is_completed))}
              onUpdate={async (x, text) => {
                const err = await onUpdate(x.id, text);
                fail('수정하지 못했어요', err);
                return !err;
              }}
              onRemove={async (x) => fail('삭제하지 못했어요', await onRemove(x.id))}
            />
          ))}
        </ul>
      )}

      <TodoInputForm
        id={`todo-add-${date}`}
        placeholder={todos.length === 0 ? (isToday ? '오늘 할 일을 적어 보세요' : '할 일을 적어 보세요') : '할 일 추가'}
        onSubmit={async (text) => {
          const err = await onAdd(date, text);
          fail('할일을 추가하지 못했어요', err);
          return !err;
        }}
      />
    </div>
  );
}
