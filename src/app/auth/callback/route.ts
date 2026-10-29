import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  // request.url 의 호스트는 `next dev -H 0.0.0.0` 에서 "0.0.0.0" 으로 나오므로,
  // 브라우저가 실제로 접속한 호스트(Host / 프록시 헤더)로 돌아간다.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const origin = `${proto}://${host}`;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  // code 가 없거나 교환에 실패한 경우
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
