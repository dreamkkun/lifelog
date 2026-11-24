import { addDays, format, parseISO } from 'date-fns';
import type { Supplement, SupplementLog } from '@/types/routine.types';

export interface SupplementStats {
  streak: number; // 지금 이어지는 연속 복용 일수 (오늘 아직 안 먹었으면 어제까지)
  last7: { date: string; taken: boolean; counted: boolean }[]; // 오래된 날 → 오늘, counted=복용 시작일 이후
  weekTaken: number;
  weekCounted: number;
}

export function supplementStats(s: Supplement, logs: SupplementLog[], today: string): SupplementStats {
  const taken = new Set(logs.filter((l) => l.supplement_id === s.id).map((l) => l.target_date));
  const end = parseISO(today);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = format(addDays(end, -i), 'yyyy-MM-dd');
    if (date < s.start_date) break;
    if (taken.has(date)) streak++;
    else if (i === 0) continue; // 오늘은 아직 가능성이 남아 있어 끊지 않는다
    else break;
  }

  const last7 = Array.from({ length: 7 }, (_, k) => {
    const date = format(addDays(end, -(6 - k)), 'yyyy-MM-dd');
    return { date, taken: taken.has(date), counted: date >= s.start_date };
  });
  return { streak, last7, weekTaken: last7.filter((d) => d.taken).length, weekCounted: last7.filter((d) => d.counted).length };
}
