'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord, RecordType } from '@/types/database.types';

export type FilterType = 'ALL' | RecordType;

const PAGE_SIZE = 20;
const SEARCH_FIELDS = ['content', 'book_title', 'lecture_title', 'book_author', 'quote', 'speaker', 'memo_title'];

/** 유형 필터 + 검색어(이미 디바운스된 값)로 아카이브를 조회한다. 20개씩 더 불러오기. */
export function useArchiveRecords(userId: string | null, type: FilterType, search: string) {
  // % * \ " 는 ilike/or() 문법을 깨므로 공백으로 치환
  const term = search.replace(/[%*\\"]/g, ' ').replace(/\s+/g, ' ').trim();
  const filterKey = `${type}|${term}`;

  // 필터가 바뀌면 페이지를 처음(20개)으로: state 를 따로 리셋하지 않고 key 로 파생해 이중 조회를 피한다.
  const [page, setPage] = useState({ key: filterKey, limit: PAGE_SIZE });
  const limit = page.key === filterKey ? page.limit : PAGE_SIZE;

  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    setIsLoading(true);

    let query = createClient()
      .from('records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('target_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (type !== 'ALL') query = query.eq('type', type);
    // 따옴표로 감싸 검색어 안의 쉼표·괄호가 or() 구분자로 해석되지 않게 한다. 공백이면 조건 없음.
    if (term) {
      const clauses = SEARCH_FIELDS.map((f) => `${f}.ilike."%${term}%"`);
      // 태그 검색: "#아이디어" 또는 "아이디어"처럼 태그 하나와 정확히 일치할 때
      const tag = term.replace(/^#/, '');
      if (tag && /^[^\s{},()]+$/.test(tag)) clauses.push(`tags.cs.{${tag}}`);
      query = query.or(clauses.join(','));
    }
    query = query.range(0, limit - 1);

    const { data, error, count } = await query;
    if (id !== requestId.current) return; // 오래된 응답 무시
    if (error) setError(error.message);
    else {
      setError(null);
      setRecords((data ?? []) as DatabaseRecord[]);
      setTotal(count ?? 0);
    }
    setIsLoading(false);
  }, [userId, type, term, limit]);

  const fetchRef = useRef(fetchRecords);
  fetchRef.current = fetchRecords;

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 다른 기기에서의 변경 반영 (현재 필터/페이지 기준으로 다시 조회)
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`archive-records-changes:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, () => fetchRef.current())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadMore = useCallback(() => setPage({ key: filterKey, limit: limit + PAGE_SIZE }), [filterKey, limit]);

  const removeLocal = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return {
    records,
    total,
    isLoading,
    error,
    hasMore: records.length < total,
    loadMore,
    removeLocal,
  };
}
