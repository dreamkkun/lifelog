import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/ui/Providers';
import BottomNav from '@/components/navigation/BottomNav';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import AndroidInstallPrompt from '@/components/pwa/AndroidInstallPrompt';
import { Noto_Serif_KR } from 'next/font/google';
import './globals.css';

const serif = Noto_Serif_KR({
  subsets: ['latin'], // 한글 글리프는 unicode-range 로 필요한 조각만 내려받는다
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
});

// Next.js 14+ 규격: viewport 는 metadata 와 분리해서 export
export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // 노치/다이내믹 아일랜드 영역까지 사용
};

export const metadata: Metadata = {
  title: 'LifeLog & Insight',
  description: '모바일 & PC 실시간 동기화 개인 기록 보관소',
  applicationName: 'LifeLog',
  appleWebApp: {
    capable: true,
    // 앱 배경이 밝은색이라 black-translucent(흰 상태바 글씨)를 쓰면 시계/배터리가 안 보인다.
    statusBarStyle: 'default',
    title: 'LifeLog',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={serif.variable}>
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased selection:bg-slate-800 selection:text-white">
        <Providers>
          {/* iOS 노치/홈 인디케이터 Safe Area 대응 */}
          {/* 모바일: 하단 탭바(4.5rem) + 홈 인디케이터만큼 여백 / md 이상: 탭바 없음 */}
          <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] md:pb-[env(safe-area-inset-bottom,0px)]">
            {children}
          </div>
          <BottomNav />
          {/* 플랫폼별 설치 안내: 환경을 자동 감지하므로 한쪽만 노출된다 */}
          <PWAInstallPrompt /> {/* iOS Safari */}
          <AndroidInstallPrompt /> {/* beforeinstallprompt 지원 브라우저 */}
        </Providers>
      </body>
    </html>
  );
}
