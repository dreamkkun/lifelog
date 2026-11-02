'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord } from '@/types/database.types';

const pad = (n: number) => String(n).padStart(2, '0');

/** 해당 월의 첫날/마지막날 (YYYY-MM-DD). month 는 1~12. */
export function monthBounds(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(lastDay)}` };
}

const byDateThenCreated = (a: DatabaseRecord, b: DatabaseRecord) =>
  a.target_date.localeCompare(b.target_date) || a.created_at.localeCompare(b.created_at);

/**
 * start~end(YYYY-MM-DD, 양 끝 포함) 범위의 기록 조회 + Realtime 구독.
 * 주간/월간 보기가 같은 훅을 쓴다. 이벤트는 전체 재조회 없이 로컬 state 에 병합/제거한다.
 */
export function useRangeRecords(userId: string | null, start: string, end: string) {
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 구독은 userId 당 한 번만 만들고, 이벤트 핸들러는 항상 최신 범위를 ref 로 읽는다.
  const rangeRef = useRef({ start, end });
  rangeRef.current = { start, end };
  const requestId = useRef(0);

  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    setIsLoading(true);
    const { data, error } = await createClient()
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .gte('target_date', start)
      .lte('target_date', end)
      .order('target_date', { ascending: true })
      .order('created_at', { ascending: true });
    if (id !== requestId.current) return; // 기간을 빠르게 넘길 때 오래된 응답 무시
    if (error) setError(error.message);
    else {
      setError(null);
      setRecords((data ?? []) as DatabaseRecord[]);
    }
    setIsLoading(false);
  }, [userId, start, end]);

  const fetchRef = useRef(fetchRecords);
  fetchRef.current = fetchRecords;

  // 기간이 바뀌면 이전 기간의 기록이 남지 않도록 비우고 다시 조회
  useEffect(() => {
    setRecords([]);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const inRange = (d: string) => d >= rangeRef.current.start && d <= rangeRef.current.end;
    let subscribedBefore = false;

    // 주의: DELETE 이벤트는 old 레코드에 PK(id)만 담기고 RLS/컬럼 필터가 적용되지 않으므로
    // user_id 서버 필터를 걸면 삭제 이벤트가 아예 도착하지 않는다. 필터 없이 구독하고
    // INSERT/UPDATE 는 RLS 로, DELETE 는 로컬 id 매칭으로 걸러낸다.
    const channel = supabase
      .channel(`dashboard-records-changes:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setRecords((prev) => prev.filter((r) => r.id !== oldId));
          return;
        }
        const rec = payload.new as unknown as DatabaseRecord;
        if (rec.user_id !== userId) return;
        // INSERT/UPDATE 공통: 현재 범위면 교체(없으면 추가), 범위 밖으로 옮겨졌으면 제거
        setRecords((prev) => {
          const rest = prev.filter((r) => r.id !== rec.id);
          return inRange(rec.target_date) ? [...rest, rec].sort(byDateThenCreated) : rest;
        });
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        // 연결이 끊겼다 복구된 경우 그 사이 놓친 이벤트를 보정
        if (subscribedBefore) fetchRef.current();
        subscribedBefore = true;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const removeLocal = useCallback((id: string) => setRecords((prev) => prev.filter((r) => r.id !== id)), []);
  const patchLocal = useCallback(
    (id: string, patch: Partial<DatabaseRecord>) =>
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [],
  );

  return { records, isLoading, error, refetch: fetchRecords, removeLocal, patchLocal };
}
