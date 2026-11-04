'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  UserRound,
} from 'lucide-react';
import type { DatabaseRecord } from '@/types/database.types';
import type { TodoItem } from '@/types/routine.types';
import {
  CategoryFilter,
  type HomeFilter,
} from '@/components/calendar/CategoryFilter';
import { DateDetailPanel } from '@/components/calendar/DateDetailPanel';
import {
  MonthlyCalendar,
  type TodoStat,
} from '@/components/calendar/MonthlyCalendar';
import { WeekStrip } from '@/components/calendar/WeekStrip';
import { DaySection, type TodoActions } from '@/components/timeline/DaySection';
import { cn, toISODate, todayISO } from '@/lib/utils';

type View = 'week' | 'month';

export interface HomeViewProps {
  records: DatabaseRecord[];
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;
  /** 보고 있는 기간(YYYY-MM-DD)이 바뀔 때 호출: 상위가 그 범위를 조회한다 (stable 한 함수여야 함) */
  onRangeChange: (start: string, end: string) => void;
  todoActions: TodoActions;
  onDeleteRecord: (r: DatabaseRecord) => void;
  /** 메모의 핀 고정/해제 */
  onTogglePin?: (r: DatabaseRecord) => void;
  onSignOut?: () => void;
  /** 목록 위에 놓을 배너(오늘의 한마디 등) */
  banner?: React.ReactNode;
}

/** 홈: 주간 타임라인(기본)과 월간 달력을 오가며 기록과 할일을 본다 */
export function HomeView({
  records,
  todos,
  isLoading,
  error,
  onRangeChange,
  todoActions,
  onDeleteRecord,
  onTogglePin,
  onSignOut,
  banner,
}: HomeViewProps) {
  const searchParams = useSearchParams();
  const view: View = searchParams.get('view') === 'month' ? 'month' : 'week';

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayISO());
  const [filter, setFilter] = useState<HomeFilter>('ALL');
  const [sheetOpen, setSheetOpen] = useState(false); // 월간 보기의 모바일 바텀시트

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const start = toISODate(view === 'week' ? weekStart : monthStart);
  const end = toISODate(
    view === 'week' ? endOfWeek(cursor) : endOfMonth(cursor),
  );

  useEffect(() => {
    onRangeChange(start, end);
  }, [start, end, onRangeChange]);

  const showTodos = filter === 'ALL' || filter === 'TODO';
  const showRecords = filter !== 'TODO';
  const inRange = useCallback(
    (d: string) => d >= start && d <= end,
    [start, end],
  );

  const visibleRecords = useMemo(
    () =>
      showRecords
        ? records.filter(
            (r) =>
              inRange(r.target_date) && (filter === 'ALL' || r.type === filter),
          )
        : [],
    [records, filter, showRecords, inRange],
  );
  const visibleTodos = useMemo(
    () => (showTodos ? todos.filter((t) => inRange(t.target_date)) : []),
    [todos, showTodos, inRange],
  );

  const todoStats = useMemo(() => {
    const map = new Map<string, TodoStat>();
    for (const t of visibleTodos) {
      const s = map.get(t.target_date) ?? { done: 0, total: 0 };
      s.total += 1;
      if (t.is_completed) s.done += 1;
      map.set(t.target_date, s);
    }
    return map;
  }, [visibleTodos]);

  // 보는 기간을 옮기면 선택일도 그 기간 안으로 맞춘다 (오늘이 포함되면 오늘, 아니면 첫날)
  const moveTo = (next: Date) => {
    setCursor(next);
    const first = view === 'week' ? startOfWeek(next) : startOfMonth(next);
    const last = view === 'week' ? endOfWeek(next) : endOfMonth(next);
    const today = todayISO();
    setSelected(
      today >= toISODate(first) && today <= toISODate(last)
        ? today
        : toISODate(first),
    );
    setSheetOpen(false);
  };
  const step = (dir: 1 | -1) =>
    moveTo(view === 'week' ? addWeeks(cursor, dir) : addMonths(cursor, dir));

  const changeView = (v: View) => {
    const url = new URL(window.location.href);
    if (v === 'month') url.searchParams.set('view', 'month');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url.toString());
  };

  const selectInWeek = (iso: string) => {
    setSelected(iso);
    requestAnimationFrame(() => {
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      document
        .getElementById(`day-${iso}`)
        ?.scrollIntoView({
          behavior: reduce ? 'auto' : 'smooth',
          block: 'start',
        });
    });
  };

  // 주간 피드: 내용이 있는 날 + 선택일 + 오늘, 최근 날짜가 위
  const feedDays = useMemo(() => {
    const set = new Set<string>();
    visibleRecords.forEach((r) => set.add(r.target_date));
    visibleTodos.forEach((t) => set.add(t.target_date));
    if (inRange(selected)) set.add(selected);
    const today = todayISO();
    if (inRange(today)) set.add(today);
    return Array.from(set).sort().reverse();
  }, [visibleRecords, visibleTodos, selected, inRange]);

  const weekNo = Math.ceil(
    (cursor.getDate() + getDay(startOfMonth(cursor))) / 7,
  );
  const title =
    view === 'week'
      ? `${format(cursor, 'M')}월 ${weekNo}주차`
      : format(cursor, 'yyyy년 M월');

  const section = (iso: string) => (
    <DaySection
      key={iso}
      date={iso}
      records={visibleRecords.filter((r) => r.target_date === iso)}
      todos={visibleTodos.filter((t) => t.target_date === iso)}
      showTodos={showTodos}
      showRecords={showRecords}
      todoActions={todoActions}
      onDeleteRecord={onDeleteRecord}
      onTogglePin={onTogglePin}
    />
  );

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div
          className={cn(
            'mx-auto space-y-3 px-4 pb-3 pt-4',
            view === 'week' ? 'max-w-2xl' : 'max-w-6xl',
          )}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <h1 className="mr-auto whitespace-nowrap font-serif text-[22px] font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <div
              role="group"
              aria-label="보기 방식"
              className="flex shrink-0 whitespace-nowrap rounded-full bg-slate-100 p-0.5 text-xs font-semibold"
            >
              {(['week', 'month'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => changeView(v)}
                  className={cn(
                    'rounded-full px-3 py-1 transition-colors',
                    view === v
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {v === 'week' ? '주간' : '월간'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => moveTo(new Date())}
              className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              오늘
            </button>
            <button
              type="button"
              aria-label={view === 'week' ? '이전 주' : '이전 달'}
              onClick={() => step(-1)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={view === 'week' ? '다음 주' : '다음 달'}
              onClick={() => step(1)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Link
              href="/new?type=diary"
              className="hidden items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 md:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> 기록하기
            </Link>
            <Link
              href="/settings/profile"
              aria-label="나의 성향 설정"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <UserRound className="h-4 w-4" />
            </Link>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                aria-label="로그아웃"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

          {view === 'week' && (
            <WeekStrip
              weekStart={weekStart}
              selected={selected}
              records={visibleRecords}
              todos={visibleTodos}
              onSelect={selectInWeek}
            />
          )}
          <CategoryFilter value={filter} onChange={setFilter} />
        </div>
      </header>

      <div
        className={cn(
          'mx-auto px-4 py-6',
          view === 'week' ? 'max-w-2xl' : 'max-w-6xl',
        )}
      >
        {banner && <div className="mb-6">{banner}</div>}
        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            불러오지 못했어요: {error}
          </p>
        )}

        {view === 'week' ? (
          <div className="divide-y divide-slate-200 [&>section]:py-7 [&>section:first-child]:pt-0">
            {feedDays.map(section)}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <MonthlyCalendar
                month={monthStart}
                records={visibleRecords}
                todoStats={todoStats}
                selected={selected}
                isLoading={isLoading}
                onSelect={(iso) => {
                  setSelected(iso);
                  setSheetOpen(true);
                }}
              />
            </div>
            <div className="lg:col-span-2">
              <DateDetailPanel
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
              >
                {section(selected)}
              </DateDetailPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
