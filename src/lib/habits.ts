// 해빗 트래커 계산(순수 함수). 습관 = 반복 할일(todo_templates), 실천 기록 = 그 반복에서 만들어진 날짜별 할일의 완료 여부.
// 그래서 습관은 할일과 항상 같은 값을 본다: 할일에서 체크하면 습관 기록에 반영되고, 반대도 마찬가지다.
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import type { TodoItem, TodoTemplate } from '@/types/routine.types';

/** done: 실천, missed: 놓침, today: 오늘이라 아직 가능, off: 반복하는 날이 아니거나 건너뜀(통계에서 제외) */
export type CellState = 'done' | 'missed' | 'today' | 'off';

export interface HabitCell {
  date: string;
  state: CellState;
}

export interface HabitSummary {
  template: TodoTemplate;
  cells: HabitCell[]; // 오래된 날 → 오늘
  streak: number; // 지금 이어지는 연속 실천 횟수(반복하는 날 기준)
  best: number; // 보는 기간 안의 최장 연속
  weekDone: number;
  weekTotal: number;
  rate: number | null; // 보는 기간의 달성률 0~100, 대상 날이 없으면 null
  scheduledTotal: number;
  doneTotal: number;
}

export const HABIT_WINDOW_DAYS = 28;

/** 이 날짜가 이 습관의 반복하는 날인지(시작일 이후, 요일 일치, 건너뛴 날 아님). */
export function isScheduled(tpl: TodoTemplate, date: string): boolean {
  if (date < tpl.start_date) return false;
  if (tpl.skipped_dates?.includes(date)) return false;
  if (tpl.repeat_type === 'WEEKLY') return tpl.weekdays.includes(parseISO(date).getDay());
  return true;
}

export function summarizeHabit(tpl: TodoTemplate, todos: TodoItem[], today: string, windowDays = HABIT_WINDOW_DAYS): HabitSummary {
  const doneDates = new Set(todos.filter((t) => t.template_id === tpl.id && t.is_completed).map((t) => t.target_date));
  const cells: HabitCell[] = [];
  const end = parseISO(today);
  for (let i = windowDays - 1; i >= 0; i--) {
    const date = format(addDays(end, -i), 'yyyy-MM-dd');
    let state: CellState = 'off';
    if (isScheduled(tpl, date)) state = doneDates.has(date) ? 'done' : date === today ? 'today' : 'missed';
    cells.push({ date, state });
  }

  // 연속: 오늘부터 거꾸로, 반복하는 날만 본다. 오늘 아직 안 했으면 끊지 않고 어제까지의 연속을 보여준다.
  let streak = 0;
  for (let i = cells.length - 1; i >= 0; i--) {
    const c = cells[i];
    if (c.state === 'off') continue;
    if (c.state === 'done') streak++;
    else if (c.state === 'today') continue;
    else break;
  }
  let best = 0;
  let run = 0;
  for (const c of cells) {
    if (c.state === 'off') continue;
    if (c.state === 'done') best = Math.max(best, ++run);
    else if (c.state === 'missed') run = 0;
  }

  const weekStart = format(startOfWeek(end, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // 월요일 시작
  const thisWeek = cells.filter((c) => c.date >= weekStart && c.state !== 'off');
  const counted = cells.filter((c) => c.state !== 'off');
  const doneTotal = counted.filter((c) => c.state === 'done').length;
  // 오늘 아직 안 한 것은 "놓침"이 아니라 가능성이 남은 날이므로 분모에서 뺀다
  const denom = counted.filter((c) => c.state !== 'today').length;
  return {
    template: tpl,
    cells,
    streak,
    best,
    weekDone: thisWeek.filter((c) => c.state === 'done').length,
    weekTotal: thisWeek.length,
    rate: denom === 0 ? null : Math.round((doneTotal / denom) * 100),
    scheduledTotal: counted.length,
    doneTotal,
  };
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function repeatLabel(tpl: TodoTemplate): string {
  if (tpl.repeat_type === 'DAILY') return '매일';
  return [...tpl.weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_KO[d]).join('·');
}
