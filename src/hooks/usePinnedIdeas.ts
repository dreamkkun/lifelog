'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord } from '@/types/database.types';

/** 대시보드에 고정할 수 있는 아이디어 개수 상한 */
export const MAX_PINNED = 6;

/**
 * 고정(is_pinned)한 메모 목록. 날짜와 상관없이 항상 가져오고, 다른 기기의 변경도 실시간으로 반영한다.
 * setPin 은 실패 시 사용자에게 보여줄 메시지를, 성공 시 null 을 돌려준다.
 */
export function usePinnedIdeas(userId: string | null) {
  const [pinned, setPinned] = useState<DatabaseRecord[]>([]);

  const fetchPinned = useCallback(async () => {
    if (!userId) return;
    const { data } = await createClient()
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'MEMO')
      .eq('is_pinned', true)
      .order('updated_at', { ascending: false })
      .limit(MAX_PINNED * 2);
    if (data) setPinned(data as DatabaseRecord[]);
  }, [userId]);

  const fetchRef = useRef(fetchPinned);
  fetchRef.current = fetchPinned;

  useEffect(() => {
    fetchPinned();
  }, [fetchPinned]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    // 메모 변경(추가/수정/삭제)이 있으면 고정 목록을 다시 읽는다. 목록이 작아서 병합보다 단순하다.
    const channel = supabase
      .channel(`pinned-ideas:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, () => fetchRef.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const setPin = useCallback(
    async (record: DatabaseRecord, pin: boolean): Promise<string | null> => {
      if (pin && !pinned.some((p) => p.id === record.id) && pinned.length >= MAX_PINNED) {
        return `고정은 최대 ${MAX_PINNED}개까지예요. 다른 아이디어의 고정을 먼저 풀어 주세요.`;
      }
      // 화면에는 먼저 반영하고, 실패하면 서버 상태로 되돌린다
      setPinned((prev) =>
        pin ? [{ ...record, is_pinned: true }, ...prev.filter((p) => p.id !== record.id)] : prev.filter((p) => p.id !== record.id),
      );
      const { error } = await createClient()
        .from('records')
        .update({ is_pinned: pin, updated_at: new Date().toISOString() })
        .eq('id', record.id);
      if (error) {
        fetchRef.current();
        return error.message;
      }
      return null;
    },
    [pinned],
  );

  return { pinned, setPin };
}
