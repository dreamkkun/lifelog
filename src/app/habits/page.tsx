'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDays, format, parseISO } from 'date-fns';
import { ArrowLeft, Check, Flame, Repeat } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRangeTodos } from '@/hooks/useTodos';
import { useToast } from '@/components/ui/Toast';
import { HABIT_WINDOW_DAYS, repeatLabel, summarizeHabit, type CellState } from '@/lib/habits';
import { cn, todayISO } from '@/lib/utils';
import type { TodoTemplate } from '@/types/routine.types';

const CELL_STYLE: Record<CellState, string> = {
  done: 'bg-emerald-500',
  missed: 'bg-rose-200',
  today: 'border border-slate-400 bg-white',
  off: 'bg-slate-100',
};
const CELL_LABEL: Record<CellState, string> = { done: '실천', missed: '놓침', today: '오늘', off: '쉬는 날' };

function Habits({ userId }: { userId: string }) {
  const toast = useToast();
  const today = todayISO();
  const start = format(addDays(parseISO(today), -(HABIT_WINDOW_DAYS - 1)), 'yyyy-MM-dd');
  // 습관은 반복 할일이라, 할일과 같은 데이터를 쓴다. 오늘 항목도 여기서 바로 체크할 수 있다.
  const { todos, toggleTodo } = useRangeTodos(userId, start, today);
  const [templates, setTemplates] = useState<TodoTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from('todo_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError('습관을 불러오지 못했어요. Supabase 에서 supabase/schema.sql 을 다시 실행했는지 확인해 주세요.');
        setTemplates((data as TodoTemplate[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const habits = useMemo(() => (templates ?? []).map((t) => summarizeHabit(t, todos, today)), [templates, todos, today]);
  const todayTodoOf = (templateId: string) => todos.find((t) => t.template_id === templateId && t.target_date === today);

  if (templates === null) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <Repeat className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-slate-800">아직 습관이 없어요</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            홈에서 할일을 추가할 때 &lsquo;매일&rsquo;이나 &lsquo;요일별&rsquo;을 고르거나, 이미 있는 할일의 수정에서 반복을 붙이면 여기에 습관으로 쌓여요.
          </p>
          <Link href="/" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
            할일 추가하러 가기
          </Link>
        </div>
      ) : (
        habits.map((h) => {
          const todayTodo = todayTodoOf(h.template.id);
          return (
            <section key={h.template.id} aria-label={h.template.content} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-sm font-semibold text-slate-900">{h.template.content}</h2>
                  <p className="text-xs text-slate-500">
                    {repeatLabel(h.template)} · {h.template.start_date.slice(5).replace('-', '/')}부터
                  </p>
                </div>
                {todayTodo && (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={todayTodo.is_completed}
                    aria-label={`오늘 ${h.template.content} ${todayTodo.is_completed ? '완료 취소' : '완료'}`}
                    onClick={async () => {
                      const err = await toggleTodo(todayTodo.id, !todayTodo.is_completed);
                      if (err) toast(`체크하지 못했어요: ${err}`, 'error');
                    }}
                    className={cn(
                      'flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
                      todayTodo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <Check className="h-4 w-4" aria-hidden /> {todayTodo.is_completed ? '오늘 완료' : '오늘 하기'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Flame className={cn('h-4 w-4', h.streak > 0 ? 'text-orange-500' : 'text-slate-300')} aria-hidden /> {h.streak}일 연속
                </span>
                <span>
                  이번 주 {h.weekDone}/{h.weekTotal}
                </span>
                <span>{HABIT_WINDOW_DAYS}일 달성률 {h.rate === null ? '-' : `${h.rate}%`}</span>
                <span>최장 {h.best}일</span>
              </div>

              <ol aria-label={`최근 ${HABIT_WINDOW_DAYS}일`} className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                {h.cells.map((c) => (
                  <li
                    key={c.date}
                    title={`${c.date} ${CELL_LABEL[c.state]}`}
                    aria-label={`${c.date} ${CELL_LABEL[c.state]}`}
                    className={cn('aspect-square rounded-md', CELL_STYLE[c.state])}
                  />
                ))}
              </ol>
              <p className="flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> 실천</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-200" /> 놓침</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 ring-1 ring-slate-200" /> 쉬는 날·건너뜀</span>
              </p>
            </section>
          );
        })
      )}
      <p className="text-xs leading-relaxed text-slate-500">
        습관은 반복 할일이에요. 할일에서 체크하면 여기에 바로 반영되고, &lsquo;이 날만 삭제&rsquo;한 날은 통계에서 빠져요.
      </p>
    </div>
  );
}

export default function HabitsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (!user) router.replace('/login');
        else setUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 메인으로 돌아가기
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">해빗 트래커</h1>
        <p className="mt-1 text-sm text-slate-500">반복 할일을 습관으로 모아 연속 실천과 달성률을 보여 드려요.</p>
      </div>
      {userId ? <Habits userId={userId} /> : <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />}
    </div>
  );
}
