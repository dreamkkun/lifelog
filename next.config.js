/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vercel 빌드에서 환경 변수가 빠지면 런타임 에러 대신 빌드를 실패시켜 Build Logs 에서 바로 확인한다.
// (로컬 `npm run build` 는 환경 변수 없이도 통과한다.)
if (process.env.VERCEL && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    '[LifeLog] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. ' +
      'Vercel → Settings → Environment Variables 에서 Production/Preview 모두 추가하세요.',
  );
}

// 가능하면 내 프로젝트 호스트만 허용하고, 모를 때만 *.supabase.co 로 넓힌다.
let supabaseHost = null;
try {
  supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null;
} catch {
  // 잘못된 URL 은 위의 와일드카드 폴백으로 처리
}
const supabaseHttps = supabaseHost ? `https://${supabaseHost}` : 'https://*.supabase.co';
const supabaseWss = supabaseHost ? `wss://${supabaseHost}` : 'wss://*.supabase.co';

// tesseract.js v7 은 Worker 스크립트, WASM 코어, 언어 데이터(kor/eng)를 모두 jsdelivr 에서 받는다.
const TESSERACT_CDN = 'https://cdn.jsdelivr.net';
const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  // 개발 서버(HMR)는 eval 이 필요하고, 프로덕션의 Tesseract WASM 은 wasm-unsafe-eval 만 있으면 된다.
  `script-src 'self' 'unsafe-inline' ${isProd ? "'wasm-unsafe-eval'" : "'unsafe-eval'"} ${TESSERACT_CDN}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHttps}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHttps} ${supabaseWss} ${TESSERACT_CDN}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost ?? '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // http:// 접속은 Vercel 이 308 로 https 로 보내며, 이후 브라우저가 https 만 쓰도록 고정
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
