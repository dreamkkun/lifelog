import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** 클라이언트 컴포넌트 전용. 렌더 중이 아니라 이펙트/핸들러 안에서 호출할 것. */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경 변수가 누락되었습니다. .env.local 설정을 확인하세요.');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
