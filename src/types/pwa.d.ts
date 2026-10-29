/** W3C beforeinstallprompt (Blink 계열 브라우저) */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/** iOS Safari 설치 안내 프롬프트 상태 */
export interface IOSInstallPromptState {
  shouldShowPrompt: boolean;
  /** iPad 는 공유 버튼이 하단 툴바가 아니라 상단에 있어 안내 문구/화살표가 다르다 */
  isIPad: boolean;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}
