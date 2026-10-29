'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDailyPersonalizedQuote } from '@/lib/utils/hashSeed';
import { todayISO } from '@/lib/utils';
import type { UserProfile } from '@/types/routine.types';

/** 오늘 날짜(로컬). 자정이 지나거나 탭으로 돌아오면 자동으로 갱신된다. */
function useToday() {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const timer = setTimeout(refresh, nextMidnight - now.getTime() + 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);

  return today;
}

/** 프로필 + 오늘 날짜로 오늘의 글귀를 산출한다 (같은 날·같은 프로필이면 항상 같은 결과). */
export function usePersonalizedInsight(profile: UserProfile | null) {
  const today = useToday();
  const insight = useMemo(() => getDailyPersonalizedQuote(today, profile), [today, profile]);
  return { today, insight };
}
