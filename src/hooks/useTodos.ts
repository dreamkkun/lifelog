'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { RepeatRule, TodoItem, TodoTemplate } from '@/types/routine.types';

const byDateThenCreated = (a: TodoItem, b: TodoItem) =>
  a.target_date.localeCompare(b.target_date) || a.created_at.localeCompare(b.created_at);

/** 반복 할 일을 미리 만들어 두는 최대 기간 (오늘 기준). 먼 미래 달을 넘겨 봐도 행이 무한정 생기지 않게 한다. */
const MAX_AHEAD_DAYS = 60;

const MISSING_TABLE_HINT = '반복 할일 테이블이 아직 없어요. Supabase 에서 supabase/schema.sql 을 다시 실행해 주세요.';

/**
 * start~end 범위의 할일 조회 + Realtime 동기화 + 추가/체크/수정/삭제 + 반복 할일 생성.
 * 액션은 실패 시 에러 메시지를 돌려준다.
 */
export function useRangeTodos(userId: string | null, start: string, end: string) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const rangeRef = useRef({ start, end });
  rangeRef.current = { start, end };
  const requestId = useRef(0);

  const upsertLocal = useCallback((row: TodoItem) => {
    setTodos((prev) => {
      const rest = prev.filter((t) => t.id !== row.id);
      const inRange = row.target_date >= rangeRef.current.start && row.target_date <= rangeRef.current.end;
      return inRange ? [...rest, row].sort(byDateThenCreated) : rest;
    });
  }, []);

  /** 보고 있는 기간에 아직 없는 반복 할일을 만든다. 같은 날 중복은 DB 의 유니크 인덱스가 막는다. */
  const syncRecurring = useCallback(
    async (existing: TodoItem[], id: number) => {
      if (!userId) return;
      const supabase = createClient();
      const { data: templates, error: tplError } = await supabase
        .from('todo_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', end);
      // 테이블이 아직 없거나 반복이 없으면 조용히 건너뛴다 (일반 할일은 계속 동작)
      if (tplError || !templates?.length) return;

      const aheadLimit = format(addDays(new Date(), MAX_AHEAD_DAYS), 'yyyy-MM-dd');
      const last = end < aheadLimit ? end : aheadLimit;
      const have = new Set(existing.filter((t) => t.template_id).map((t) => `${t.template_id}|${t.target_date}`));

      const missing: { template_id: string; target_date: string; content: string }[] = [];
      for (const tpl of templates as TodoTemplate[]) {
        const from = tpl.start_date > start ? tpl.start_date : start;
        if (from > last) continue;
        for (const day of eachDayOfInterval({ start: parseISO(from), end: parseISO(last) })) {
          if (tpl.repeat_type === 'WEEKLY' && !tpl.weekdays.includes(day.getDay())) continue;
          const date = format(day, 'yyyy-MM-dd');
          if (!have.has(`${tpl.id}|${date}`)) missing.push({ template_id: tpl.id, target_date: date, content: tpl.content });
        }
      }
      if (missing.length === 0) return;

      const { data, error: insError } = await supabase
        .from('todos')
        .upsert(missing, { onConflict: 'template_id,target_date', ignoreDuplicates: true })
        .select();
      if (id !== requestId.current || insError) return;
      for (const row of (data ?? []) as TodoItem[]) upsertLocal(row);
    },
    [userId, start, end, upsertLocal],
  );

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
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    const rows = (data ?? []) as TodoItem[];
    setTodos(rows);
    await syncRecurring(rows, id);
  }, [userId, start, end, syncRecurring]);

  const fetchRef = useRef(fetchTodos);
  fetchRef.current = fetchTodos;

  useEffect(() => {
    setTodos([]);
    fetchTodos();
  }, [fetchTodos]);

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
    async (date: string, content: string, repeat?: RepeatRule | null): Promise<string | null> => {
      const supabase = createClient();

      if (repeat) {
        const { error } = await supabase.from('todo_templates').insert({
          content,
          repeat_type: repeat.type,
          weekdays: repeat.type === 'WEEKLY' ? repeat.weekdays : [],
          start_date: date,
        });
        if (error) return /todo_templates|schema cache|does not exist/i.test(error.message) ? MISSING_TABLE_HINT : error.message;
        await fetchRef.current(); // 방금 만든 반복의 오늘/이번 기간 분을 바로 생성해 보여준다
        return null;
      }

      const { data, error } = await supabase.from('todos').insert({ target_date: date, content }).select().single();
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

  const updateTodo = useCallback(async (id: string, content: string): Promise<string | null> => {
    const { data, error } = await createClient().from('todos').update({ content }).eq('id', id).select('id');
    if (error) return error.message;
    if (!data || data.length === 0) return '수정할 할일을 찾지 못했어요.';
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
    return null;
  }, []);

  const removeTodo = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await createClient().from('todos').delete().eq('id', id);
    if (error) return error.message;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    return null;
  }, []);

  /**
   * 반복을 멈춘다: 이 날짜부터의 항목을 지우고 앞으로 새로 만들지 않는다. 지난 날의 기록은 남는다.
   * (항목만 지우면 다음에 화면을 열 때 반복이 다시 만들어 넣기 때문에 반복 자체를 끈다.)
   */
  const stopRepeat = useCallback(async (todo: TodoItem): Promise<string | null> => {
    if (!todo.template_id) return null;
    const supabase = createClient();
    const { error: offError } = await supabase.from('todo_templates').update({ is_active: false }).eq('id', todo.template_id);
    if (offError) return offError.message;
    const { error: delError } = await supabase
      .from('todos')
      .delete()
      .eq('template_id', todo.template_id)
      .gte('target_date', todo.target_date);
    if (delError) return delError.message;
    setTodos((prev) => prev.filter((t) => !(t.template_id === todo.template_id && t.target_date >= todo.target_date)));
    return null;
  }, []);

  return { todos, error, addTodo, toggleTodo, updateTodo, removeTodo, stopRepeat };
}
