// iOS/Android 설치 프롬프트가 공유하는 환경 판별·쿨다운 유틸 (클라이언트 전용)

export const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** 홈 화면에 설치된 PWA 로 실행 중인지 */
export function isStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// 저장소 접근이 막힌 환경(사생활 보호 모드 등)에서는 예외를 삼키고 "기록 없음"으로 취급한다.

/** "7일간 보지 않기" 쿨다운이 유효한지 */
export function isCoolingDown(key: string): boolean {
  try {
    const t = parseInt(localStorage.getItem(key) ?? '', 10);
    return Number.isFinite(t) && Date.now() - t < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function startCooldown(key: string) {
  try {
    localStorage.setItem(key, Date.now().toString());
  } catch {
    // 무시
  }
}

export function clearCooldown(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
}

/** 단순 닫기(X/확인)는 이 탭 세션 동안만 다시 띄우지 않는다. */
export function wasClosedThisSession(key: string): boolean {
  try {
    return sessionStorage.getItem(`${key}:session`) === '1';
  } catch {
    return false;
  }
}

export function markClosedThisSession(key: string) {
  try {
    sessionStorage.setItem(`${key}:session`, '1');
  } catch {
    // 무시
  }
}
