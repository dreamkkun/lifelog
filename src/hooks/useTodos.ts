'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TodoItem } from '@/types/routine.types';

const byDateThenCreated = (a: TodoItem, b: TodoItem) =>
  a.target_date.localeCompare(b.target_date) || a.created_at.localeCompare(b.created_at);

/** start~end 범위의 할일 조회 + Realtime 동기화 + 추가/체크/삭제. 액션은 실패 시 에러 메시지를 돌려준다. */
export function useRangeTodos(userId: string | null, start: string, end: string) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef({ start, end });
  rangeRef.current = { start, end };
  const requestId = useRef(0);

  const fetchTodos = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    const { data, error } = await createClient()
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .gte('target_date', start)
      .lte('target_date', end)
      .order('target_date', { ascending: true })
      .order('created_at', { ascending: true });
    if (id !== requestId.current) return;
    if (error) setError(error.message);
    else {
      setError(null);
      setTodos((data ?? []) as TodoItem[]);
    }
  }, [userId, start, end]);

  const fetchRef = useRef(fetchTodos);
  fetchRef.current = fetchTodos;

  useEffect(() => {
    setTodos([]);
    fetchTodos();
  }, [fetchTodos]);

  const upsertLocal = useCallback((row: TodoItem) => {
    setTodos((prev) => {
      const rest = prev.filter((t) => t.id !== row.id);
      const inRange = row.target_date >= rangeRef.current.start && row.target_date <= rangeRef.current.end;
      return inRange ? [...rest, row].sort(byDateThenCreated) : rest;
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let subscribedBefore = false;
    // records 와 같은 이유로 서버 필터 없이 구독한다 (DELETE 이벤트는 id 만 온다)
    const channel = supabase
      .channel(`todos-changes:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setTodos((prev) => prev.filter((t) => t.id !== oldId));
          return;
        }
        const row = payload.new as unknown as TodoItem;
        if (row.user_id === userId) upsertLocal(row);
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        if (subscribedBefore) fetchRef.current();
        subscribedBefore = true;
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, upsertLocal]);

  const addTodo = useCallback(
    async (date: string, content: string): Promise<string | null> => {
      const { data, error } = await createClient()
        .from('todos')
        .insert({ target_date: date, content })
        .select()
        .single();
      if (error) return error.message;
      upsertLocal(data as TodoItem); // 실시간 이벤트가 먼저 와도 id 로 합쳐져 중복되지 않는다
      return null;
    },
    [upsertLocal],
  );

  const toggleTodo = useCallback(async (id: string, completed: boolean): Promise<string | null> => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, is_completed: completed } : t))); // 체크는 즉시 반영
    const { error } = await createClient().from('todos').update({ is_completed: completed }).eq('id', id);
    if (error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, is_completed: !completed } : t)));
      return error.message;
    }
    return null;
  }, []);

  const removeTodo = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await createClient().from('todos').delete().eq('id', id);
    if (error) return error.message;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    return null;
  }, []);

  return { todos, error, addTodo, toggleTodo, removeTodo };
}
