import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeLog & Insight',
    short_name: 'LifeLog',
    description: '일기, 독서 발췌, 강의 필기 및 OCR 통합 개인 아카이빙 웹앱',
    lang: 'ko',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // 앱 바탕(slate-50)과 같은 밝은 색: 설치한 앱의 시작 화면과 상단 상태 표시줄이 어둡게 보이지 않게 한다
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
