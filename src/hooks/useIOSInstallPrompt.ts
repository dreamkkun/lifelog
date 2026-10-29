'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IOSInstallPromptState } from '@/types/pwa';
import { isCoolingDown, isStandaloneMode, markClosedThisSession, startCooldown, wasClosedThisSession } from '@/lib/pwa';

const STORAGE_KEY = 'pwa_ios_prompt_dismissed';
const SHOW_DELAY_MS = 3000;

// 설치 방법이 다른 Safari 외 브라우저/인앱 브라우저
const NON_SAFARI = /crios|fxios|edgios|opios|gsa\/|kakaotalk|naver|instagram|fban|fbav|line\/|daumapps|twitter|whale/;

export function useIOSInstallPrompt() {
  const [state, setState] = useState<IOSInstallPromptState>({ shouldShowPrompt: false, isIPad: false });

  useEffect(() => {
    // 이미 홈 화면에서 실행 중이면 안내하지 않는다
    if (isStandaloneMode()) return;

    const ua = window.navigator.userAgent.toLowerCase();
    // iPadOS 13+ 는 UA 가 Macintosh 로 보고되므로 터치 포인트로 구분
    const isIPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
    const isIOS = /iphone|ipad|ipod/.test(ua) || isIPadOS;
    // 진짜 Safari 는 Version/x 와 Safari 토큰을 모두 갖는다
    const isSafari = /version\/[\d.]+.*safari/.test(ua) && !NON_SAFARI.test(ua);
    if (!isIOS || !isSafari) return;

    if (isCoolingDown(STORAGE_KEY) || wasClosedThisSession(STORAGE_KEY)) return;

    // 페이지를 인지할 시간을 준 뒤 노출
    const timer = setTimeout(
      () => setState({ shouldShowPrompt: true, isIPad: /ipad/.test(ua) || isIPadOS }),
      SHOW_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  /** persistent=true: 7일간 보지 않기 / false: 이 탭 세션에서만 닫기 */
  const dismissPrompt = useCallback((persistent: boolean = false) => {
    setState((prev) => ({ ...prev, shouldShowPrompt: false }));
    if (persistent) startCooldown(STORAGE_KEY);
    else markClosedThisSession(STORAGE_KEY);
  }, []);

  return { ...state, dismissPrompt };
}
