'use client';

import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { parseISO } from 'date-fns';
import type { RepeatRule, TodoItem as Todo, Weekday } from '@/types/routine.types';
import TodoItem from './TodoItem';
import TodoInputForm from './TodoInputForm';

interface DailyTodoListProps {
  date: string;
  todos: Todo[];
  isToday: boolean;
  onAdd: (date: string, text: string, repeat: RepeatRule | null) => Promise<string | null>;
  onToggle: (id: string, completed: boolean) => Promise<string | null>;
  onUpdate: (id: string, content: string) => Promise<string | null>;
  onRemove: (id: string) => Promise<string | null>;
  /** 반복 할일: 이 날짜부터 반복을 멈추고 항목을 지운다 */
  onStopRepeat: (todo: Todo) => Promise<string | null>;
  /** 반복 할일: 이 날 항목만 지운다 (반복은 계속) */
  onSkipOnce: (todo: Todo) => Promise<string | null>;
  /** 한 번짜리 할일을 매일/요일별 반복으로 바꾼다 */
  onMakeRepeat: (todo: Todo, content: string, repeat: RepeatRule) => Promise<string | null>;
}

/** 선택한 날짜의 할일: 진행률, 미완료(위)/완료(아래) 정렬, 체크·삭제·추가 */
export default function DailyTodoList({ date, todos, isToday, onAdd, onToggle, onUpdate, onRemove, onStopRepeat, onSkipOnce, onMakeRepeat }: DailyTodoListProps) {
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
        <Link href="/habits" className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
          습관
        </Link>
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
              onUpdate={async (x, text, repeat) => {
                const err = repeat ? await onMakeRepeat(x, text, repeat) : await onUpdate(x.id, text);
                fail(repeat ? '반복으로 바꾸지 못했어요' : '수정하지 못했어요', err);
                if (!err && repeat) toast('반복 할일로 바꿨어요.');
                return !err;
              }}
              onRemove={async (x) => fail('삭제하지 못했어요', await onRemove(x.id))}
              onSkipOnce={async (x) => {
                const err = await onSkipOnce(x);
                fail('삭제하지 못했어요', err);
                if (!err) toast('이 날 항목만 지웠어요. 반복은 계속돼요.');
              }}
              onStopRepeat={async (x) => {
                const err = await onStopRepeat(x);
                fail('반복을 멈추지 못했어요', err);
                if (!err) toast('이 날부터 반복을 멈췄어요. 지난 날의 기록은 남아요.');
              }}
            />
          ))}
        </ul>
      )}

      <TodoInputForm
        id={`todo-add-${date}`}
        placeholder={todos.length === 0 ? (isToday ? '오늘 할 일을 적어 보세요' : '할 일을 적어 보세요') : '할 일 추가'}
        defaultWeekday={parseISO(date).getDay() as Weekday}
        onSubmit={async (text, repeat) => {
          const err = await onAdd(date, text, repeat);
          fail('할일을 추가하지 못했어요', err);
          return !err;
        }}
      />
    </div>
  );
}
