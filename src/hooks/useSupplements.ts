'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { todayISO } from '@/lib/utils';
import type { Supplement, SupplementLog } from '@/types/routine.types';

const MISSING_TABLE_HINT = '영양제 테이블이 아직 없어요. Supabase 에서 supabase/schema.sql 을 다시 실행해 주세요.';
const friendly = (m: string) => (/supplements|supplement_logs|schema cache|does not exist/i.test(m) ? MISSING_TABLE_HINT : m);

/** 연속 복용을 셀 때 되돌아보는 기간 */
export const SUPPLEMENT_WINDOW_DAYS = 28;

export interface NewSupplement {
  name: string;
  catalog_key: string | null;
  dose: string | null;
  remind: boolean;
  remind_time: string;
}

export function useSupplements(userId: string | null) {
  const today = todayISO();
  const from = format(addDays(parseISO(today), -(SUPPLEMENT_WINDOW_DAYS - 1)), 'yyyy-MM-dd');
  const [supplements, setSupplements] = useState<Supplement[] | null>(null);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const [{ data: list, error: listError }, { data: logRows }] = await Promise.all([
      supabase.from('supplements').select('*').eq('user_id', userId).eq('is_active', true).order('remind_time', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('supplement_logs').select('*').eq('user_id', userId).gte('target_date', from).lte('target_date', today),
    ]);
    if (listError) {
      setError(friendly(listError.message));
      setSupplements([]);
      return;
    }
    setError(null);
    setSupplements((list ?? []) as Supplement[]);
    setLogs((logRows ?? []) as SupplementLog[]);
  }, [userId, from, today]);

  useEffect(() => {
    load();
  }, [load]);

  const takenToday = useMemo(() => new Set(logs.filter((l) => l.target_date === today).map((l) => l.supplement_id)), [logs, today]);

  const add = useCallback(
    async (input: NewSupplement): Promise<string | null> => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
      const { data, error: err } = await createClient().from('supplements').insert({ ...input, time_zone: tz }).select().single();
      if (err) return friendly(err.message);
      setSupplements((prev) => [...(prev ?? []), data as Supplement].sort((a, b) => a.remind_time.localeCompare(b.remind_time)));
      return null;
    },
    [],
  );

  const update = useCallback(async (id: string, patch: Partial<Pick<Supplement, 'name' | 'dose' | 'remind' | 'remind_time'>>): Promise<string | null> => {
    const { data, error: err } = await createClient().from('supplements').update(patch).eq('id', id).select().single();
    if (err) return friendly(err.message);
    setSupplements((prev) => (prev ?? []).map((s) => (s.id === id ? (data as Supplement) : s)).sort((a, b) => a.remind_time.localeCompare(b.remind_time)));
    return null;
  }, []);

  /** 복용을 그만둔다: 기록은 남기고 목록과 알림에서만 뺀다. */
  const stop = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await createClient().from('supplements').update({ is_active: false, remind: false }).eq('id', id);
    if (err) return friendly(err.message);
    setSupplements((prev) => (prev ?? []).filter((s) => s.id !== id));
    return null;
  }, []);

  /** 오늘 먹었음을 체크하거나 취소한다. 화면에는 바로 반영하고 실패하면 되돌린다. */
  const toggleTaken = useCallback(
    async (id: string): Promise<string | null> => {
      if (!userId) return null;
      const supabase = createClient();
      const existing = logs.find((l) => l.supplement_id === id && l.target_date === today);
      if (existing) {
        setLogs((prev) => prev.filter((l) => l.id !== existing.id));
        const { error: err } = await supabase.from('supplement_logs').delete().eq('id', existing.id);
        if (err) {
          setLogs((prev) => [...prev, existing]);
          return friendly(err.message);
        }
        return null;
      }
      const { data, error: err } = await supabase
        .from('supplement_logs')
        .upsert({ user_id: userId, supplement_id: id, target_date: today }, { onConflict: 'supplement_id,target_date' })
        .select()
        .single();
      if (err) return friendly(err.message);
      setLogs((prev) => [...prev.filter((l) => !(l.supplement_id === id && l.target_date === today)), data as SupplementLog]);
      return null;
    },
    [userId, logs, today],
  );

  return { today, from, supplements, logs, takenToday, error, add, update, stop, toggleTaken };
}
