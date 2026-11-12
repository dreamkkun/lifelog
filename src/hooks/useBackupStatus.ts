'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const EXPORT_KEY = 'lifelog:last-export';
export const EXPORT_EVENT = 'lifelog:exported';

/** JSON 내려받기에 성공한 시각을 이 기기에 남긴다 (백업 상태 표시용) */
export function markExported() {
  try {
    localStorage.setItem(EXPORT_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(EXPORT_EVENT));
  } catch {
    // 저장소를 못 쓰는 환경에서는 표시만 못 한다
  }
}

function readExported(): string | null {
  try {
    return localStorage.getItem(EXPORT_KEY);
  } catch {
    return null;
  }
}

/** 브라우저의 온라인/오프라인 상태 */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export interface BackupStatus {
  /** 클라우드(Supabase)에 저장돼 있는 기록·할일 수. 조회 전/실패 시 null */
  recordCount: number | null;
  todoCount: number | null;
  /** 클라우드에 가장 최근에 저장·수정된 기록 시각 (ISO) */
  lastSavedAt: string | null;
  /** 이 기기에서 마지막으로 JSON 을 내려받은 시각 (ISO) */
  lastExportAt: string | null;
  loading: boolean;
  /** 클라우드 조회에 실패했는지 */
  failed: boolean;
  refresh: () => void;
}

/**
 * 클라우드 저장 상태. 이 앱은 저장할 때마다 Supabase 에 바로 쓰므로 별도의 백업 작업은 없다.
 * 여기서는 클라우드에 실제로 들어 있는 양과 마지막 저장 시각을 조회해 보여준다.
 */
export function useBackupStatus(userId: string | null): BackupStatus {
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [todoCount, setTodoCount] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLastExportAt(readExported());
    const onExport = () => setLastExportAt(readExported());
    window.addEventListener(EXPORT_EVENT, onExport);
    return () => window.removeEventListener(EXPORT_EVENT, onExport);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase.from('records').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('todos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('records').select('updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
    ])
      .then(([records, todos, latest]) => {
        if (cancelled) return;
        const bad = records.error || todos.error || latest.error;
        setFailed(!!bad);
        if (bad) return;
        setRecordCount(records.count ?? 0);
        setTodoCount(todos.count ?? 0);
        setLastSavedAt((latest.data?.[0]?.updated_at as string | undefined) ?? null);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { recordCount, todoCount, lastSavedAt, lastExportAt, loading, failed, refresh };
}
