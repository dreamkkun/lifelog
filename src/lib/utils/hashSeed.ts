import { FALLBACK_QUOTE, MBTI_TIPS, QUOTE_DATABASE } from '@/lib/constants/quotesDatabase';
import type { QuoteCategory, QuoteData, UserProfile } from '@/types/routine.types';

/** FNV-1a 32bit 문자열 해시 (부호 없는 정수) */
export function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** YYYY-MM-DD → 1970-01-01 부터 센 날짜 번호 (로컬 날짜 문자열을 그대로 쓰므로 시간대와 무관) */
function dayNumber(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  return m ? Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000) : null;
}

const CATEGORIES: QuoteCategory[] = ['전략·통찰', '성찰·회복', '원칙·실행', '도전·모험', '소통·혁신'];
const BY_CATEGORY = CATEGORIES.map((c) => QUOTE_DATABASE.filter((q) => q.category === c));

/**
 * 같은 날짜 + 같은 프로필이면 항상 같은 글귀를 돌려주는 결정론적 선택.
 * - 프로필 해시(FNV-1a)가 순환의 시작 위치를 정하고, 날짜마다 한 칸씩 넘어간다.
 * - 5개 축을 번갈아 돌기 때문에 같은 분위기의 글귀가 연달아 나오지 않고,
 *   축별 개수가 같다면 (축 수 × 축별 개수)일 동안 같은 글귀가 반복되지 않는다.
 * - 외부 API 호출이 없고, 자정에 날짜가 바뀌면 다음 글귀가 된다.
 */
export function getDailyPersonalizedQuote(dateStr: string, profile: UserProfile | null): QuoteData {
  if (!profile) return FALLBACK_QUOTE;

  const offset = fnv1a(`${profile.mbti}_${profile.zodiac_animal}_${profile.star_sign}`);
  const position = (dayNumber(dateStr) ?? fnv1a(dateStr)) + offset;

  const group = BY_CATEGORY[position % CATEGORIES.length];
  const pool = group.length > 0 ? group : QUOTE_DATABASE;
  const base = pool[Math.floor(position / CATEGORIES.length) % pool.length];

  // 글귀별 행동 가이드 뒤에 MBTI 성향에 맞춘 한 줄을 덧붙인다
  return { ...base, actionAdvice: `${base.actionAdvice} ${MBTI_TIPS[profile.mbti]}` };
}
