'use client';

import { useEffect, useState } from 'react';
import type { RecordType } from '@/types/database.types';

// "+" 버튼이 열 기록 종류. 홈/아카이브에서 고른 종류 필터(독서 등)를 따라가서, 독서를 보다가 +를 누르면 독서 기록이 열린다.
// 필터는 화면 안의 상태라 하단 탭바 같은 다른 곳에서는 모르므로, 이 탭의 세션 저장소를 거쳐 공유한다.
export type NewRecordType = 'diary' | 'book' | 'lecture' | 'memo';

const KEY = 'lifelog:new-record-type';
const EVENT = 'lifelog:new-record-type-changed';
const TYPES: NewRecordType[] = ['diary', 'book', 'lecture', 'memo'];

/** 홈/아카이브 필터 값을 새 기록 종류로 바꾼다. 전체·할일처럼 종류가 정해지지 않으면 일기(기본) */
export function typeFromFilter(filter: RecordType | 'ALL' | 'TODO'): NewRecordType {
  return filter === 'ALL' || filter === 'TODO' ? 'diary' : (filter.toLowerCase() as NewRecordType);
}

export function setNewRecordType(type: NewRecordType) {
  try {
    sessionStorage.setItem(KEY, type);
  } catch {
    // 저장소를 못 쓰는 환경에서는 기본(일기)으로 열린다
  }
  window.dispatchEvent(new Event(EVENT));
}

function read(): NewRecordType {
  try {
    const v = sessionStorage.getItem(KEY);
    return TYPES.includes(v as NewRecordType) ? (v as NewRecordType) : 'diary';
  } catch {
    return 'diary';
  }
}

export function newRecordHref(type: NewRecordType, date?: string) {
  return `/new?type=${type}${date ? `&date=${date}` : ''}`;
}

/** 지금 "+" 가 열어야 할 기록 종류 */
export function useNewRecordType(): NewRecordType {
  const [type, setType] = useState<NewRecordType>('diary');
  useEffect(() => {
    const update = () => setType(read());
    update();
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return type;
}
