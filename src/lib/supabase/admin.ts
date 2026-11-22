import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * 서비스 롤 클라이언트: RLS 를 우회하므로 사용자 요청이 아니라 예약 발송처럼 서버끼리 도는 작업에서만 쓴다.
 * SUPABASE_SERVICE_ROLE_KEY 는 서버 전용 환경 변수이며 NEXT_PUBLIC_ 접두사를 붙이면 안 된다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
