'use client';

import { useCallback, useEffect, useState } from 'react';

// 메인 화면에서 일기 내용을 가릴지. 옆 사람이 화면을 볼 수 있어서 기본은 가림이고, 이 기기에만 저장한다.
const KEY = 'lifelog:hide-diary';
const EVENT = 'lifelog:hide-diary-changed';

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'; // 저장된 값이 없으면 가림
  } catch {
    return true;
  }
}

/** [가림 여부, 바꾸기]. 여러 항목과 헤더 버튼이 같은 값을 보도록 이벤트로 동기화한다. */
export function useHideDiary(): [boolean, (hidden: boolean) => void] {
  const [hidden, setHiddenState] = useState(true);

  useEffect(() => {
    const update = () => setHiddenState(read());
    update();
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);

  const setHidden = useCallback((next: boolean) => {
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // 저장소를 못 쓰는 환경에서는 이번 화면에서만 바뀐다
      setHiddenState(next);
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [hidden, setHidden];
}
