'use client';

import { useEffect } from 'react';

/** 서비스 워커 등록. 홈 화면에 설치하려면 브라우저가 서비스 워커를 요구한다. 개발 서버에서는 등록하지 않는다. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // 등록에 실패해도 앱은 그대로 쓸 수 있다 (설치 안내만 안 나올 수 있다)
    });
  }, []);
  return null;
}
