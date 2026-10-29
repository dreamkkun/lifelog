# 배포 체크리스트 (Vercel + Supabase)

## 0. 푸시 전

```bash
npm run verify   # type-check → lint → build (하나라도 실패하면 중단). exit 0 일 때만 push
```

커밋 시 `.husky/pre-commit` 이 스테이징된 파일에 `next lint --fix` 와 전체 `tsc --noEmit` 을 실행합니다.

## 1. Supabase

1. SQL Editor 에서 `supabase/schema.sql` 실행 (테이블, RLS, Realtime, `record-images` 버킷/정책)
2. Authentication → URL Configuration
   - **Site URL**: `https://<도메인>.vercel.app` (또는 커스텀 도메인)
   - **Redirect URLs**
     - `https://<도메인>.vercel.app/**`
     - `https://<도메인>.vercel.app/auth/callback`
     - `https://*-<팀>.vercel.app/**` (Preview 배포)
     - `http://localhost:3000/**`
3. (선택) Google 로그인: Authentication → Providers → Google 활성화

## 2. Vercel 환경 변수 (Production / Preview / Development 모두)

| 이름                            | 값                                 |
| ------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://<project-id>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key         |

Service Role Key 는 이 앱에서 쓰지 않으며 `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다.
Vercel 빌드에서 위 두 변수가 없으면 `next.config.js` 가 빌드를 실패시킵니다.

## 3. 배포 후 확인

| 항목        | 방법                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| 로그인 콜백 | 매직링크 메일의 URL 이 프로덕션 도메인인지, 로그인 후 `/` 로 돌아오는지               |
| Storage RLS | 로그아웃 상태에서 `record-images` 업로드/조회 API 직접 호출이 거부되는지              |
| HTTPS       | `http://` 접속 시 308 로 `https://` 이동하는지                                        |
| PWA         | Chrome DevTools → Application → Manifest 에 오류가 없고 Installable 인지 (Lighthouse) |
| OCR + CSP   | 실제 모바일에서 강의 사진 업로드 시 콘솔에 `Blocked by CSP` 가 없는지                 |

## CSP 메모

- tesseract.js v7 은 Worker 스크립트·WASM 코어·언어 데이터(kor/eng)를 모두 `https://cdn.jsdelivr.net` 에서 받으므로 `script-src`/`connect-src` 에 허용되어 있습니다.
- 프로덕션은 `'wasm-unsafe-eval'`(WASM 컴파일)만 허용합니다. iOS Safari 16 미만은 이 키워드를 몰라 OCR 이 막힐 수 있습니다.
- Supabase 호스트는 `NEXT_PUBLIC_SUPABASE_URL` 에서 읽어 내 프로젝트만 허용합니다. 환경 변수가 없는 빌드에서는 `*.supabase.co` 로 넓어집니다.
