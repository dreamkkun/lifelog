import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord } from '@/types/database.types';
import type { TodoItem, UserProfile } from '@/types/routine.types';

const PAGE = 1000; // Supabase 한 번 조회 상한
const BUCKET = 'record-images';

export interface BackupFile {
  app: 'LifeLog';
  version: 1;
  exportedAt: string;
  profile: UserProfile | null;
  records: DatabaseRecord[];
  todos: TodoItem[];
  /** 이미지 파일은 JSON 에 담기지 않는다. records[].image_urls 는 Storage 경로다. */
  note: string;
}

/** 내 기록·할일·프로필을 모두 모은다. 실패 시 Error. */
export async function exportAllData(userId: string): Promise<BackupFile> {
  const supabase = createClient();

  const records: DatabaseRecord[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    records.push(...((data ?? []) as DatabaseRecord[]));
    if (!data || data.length < PAGE) break;
  }

  const todos: TodoItem[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    todos.push(...((data ?? []) as TodoItem[]));
    if (!data || data.length < PAGE) break;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, mbti, zodiac_animal, star_sign')
    .eq('user_id', userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  return {
    app: 'LifeLog',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: (profile as UserProfile | null) ?? null,
    records,
    todos,
    note: '이미지 파일은 포함되지 않습니다. records[].image_urls 는 Storage(record-images) 경로입니다.',
  };
}

/** 브라우저에서 JSON 파일로 저장한다. */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 내 데이터를 모두 지운다(이미지 파일, 기록, 할일, 성향). 로그인 계정 자체는 남는다.
 * 이미지 → 행 순서로 지우며, 중간에 실패하면 에러 메시지를 돌려주고 멈춘다.
 */
export async function resetAllData(userId: string): Promise<string | null> {
  const supabase = createClient();

  // 1. 지울 이미지 경로 수집
  const paths: string[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('records')
      .select('image_urls')
      .eq('user_id', userId)
      .range(from, from + PAGE - 1);
    if (error) return error.message;
    for (const r of data ?? []) paths.push(...((r.image_urls as string[] | null) ?? []));
    if (!data || data.length < PAGE) break;
  }

  // 2. Storage 이미지 삭제 (100개씩)
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) return error.message;
  }

  // 3. 행 삭제
  for (const table of ['records', 'todos', 'user_profiles'] as const) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) return error.message;
  }
  return null;
}
