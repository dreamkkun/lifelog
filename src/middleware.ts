import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// src/ 디렉터리를 쓰는 프로젝트에서는 미들웨어가 src/middleware.ts 에 있어야 실행된다.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 아래 패턴을 제외한 모든 요청 경로에 미들웨어 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico
     * - manifest.webmanifest (PWA: 비로그인 상태에서도 설치 가능해야 함)
     * - 정적 미디어 확장자 (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
