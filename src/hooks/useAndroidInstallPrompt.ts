'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BeforeInstallPromptEvent } from '@/types/pwa';
import {
  clearCooldown,
  isCoolingDown,
  isStandaloneMode,
  markClosedThisSession,
  startCooldown,
  wasClosedThisSession,
} from '@/lib/pwa';

const STORAGE_KEY = 'pwa_android_prompt_dismissed';
const SHOW_DELAY_MS = 1500;

export function useAndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // 브라우저 기본 미니 인포바는 쿨다운 중이어도 항상 억제하고, 이벤트는 보관해 둔다.
      e.preventDefault();
      setDeferredPrompt(e);
      if (isCoolingDown(STORAGE_KEY) || wasClosedThisSession(STORAGE_KEY)) return; // UI 만 숨김
      timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    };

    const handleAppInstalled = () => {
      clearTimeout(timer);
      setDeferredPrompt(null);
      setIsOpen(false);
      clearCooldown(STORAGE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    // prompt() 는 이벤트당 한 번만 쓸 수 있다. 시스템 다이얼로그가 위에 뜨므로 우리 모달은 먼저 닫는다.
    setDeferredPrompt(null);
    setIsOpen(false);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'dismissed') startCooldown(STORAGE_KEY);
    } catch {
      // 사용자 제스처 없이 호출되는 등 prompt() 가 거부된 경우: 모달만 닫힌 상태로 둔다
    }
  }, [deferredPrompt]);

  /** persistent=true: 7일간 보지 않기(나중에 하기) / false: 이 탭 세션에서만 닫기 */
  const dismissModal = useCallback((persistent: boolean = false) => {
    setIsOpen(false);
    if (persistent) startCooldown(STORAGE_KEY);
    else markClosedThisSession(STORAGE_KEY);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isOpen,
    triggerInstall,
    dismissModal,
  };
}
