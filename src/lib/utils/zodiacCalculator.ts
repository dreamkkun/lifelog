import type { MBTIType, StarSign, ZodiacAnimal } from '@/types/routine.types';

export const MBTI_LIST: MBTIType[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

// 쥐띠부터 순서대로 (서기 4년이 쥐띠 해)
const ZODIAC_ANIMALS: ZodiacAnimal[] = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

export const ZODIAC_EMOJI_MAP: Record<ZodiacAnimal, string> = {
  쥐: '🐭', 소: '🐮', 호랑이: '🐯', 토끼: '🐰', 용: '🐲', 뱀: '🐍',
  말: '🐴', 양: '🐑', 원숭이: '🐵', 닭: '🐔', 개: '🐶', 돼지: '🐷',
};

export const STAR_SIGN_EMOJI_MAP: Record<StarSign, string> = {
  물병자리: '♒', 물고기자리: '♓', 양자리: '♈', 황소자리: '♉',
  쌍둥이자리: '♊', 게자리: '♋', 사자자리: '♌', 처녀자리: '♍',
  천칭자리: '♎', 전갈자리: '♏', 사수자리: '♐', 염소자리: '♑',
};

/**
 * 연도 기반 12간지 띠.
 * 양력 생일은 입춘(2월 4일경) 이전이면 전년도 띠로 보정하고, 음력 생일은 그 해 그대로 쓴다.
 */
export function calculateZodiacAnimal(year: number, month: number, day: number, isLunar: boolean): ZodiacAnimal {
  let targetYear = year;
  if (!isLunar && (month < 2 || (month === 2 && day < 4))) targetYear -= 1;
  const index = (targetYear - 4) % 12;
  return ZODIAC_ANIMALS[index < 0 ? index + 12 : index];
}

/** 양력 월/일 기반 서양 12별자리 (국내에서 흔히 쓰는 구간) */
export function calculateStarSign(month: number, day: number): StarSign {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '물병자리';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '물고기자리';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '양자리';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '황소자리';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '쌍둥이자리';
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '게자리';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '사자자리';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '처녀자리';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '천칭자리';
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '전갈자리';
  if ((month === 11 && day >= 23) || (month === 12 && day <= 24)) return '사수자리';
  return '염소자리';
}

const parseYmd = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
};

/**
 * 음력 → 양력. 브라우저의 중국력(Intl) 데이터로 해당 음력 날짜가 되는 양력 날짜를 찾는다.
 * 존재하지 않는 음력 날짜(예: 작은 달의 30일)이거나 Intl 을 지원하지 않으면 null.
 */
export function lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean): Date | null {
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return null;
  }
  // 음력 연도 y 는 양력으로 y년 1월 중순 ~ y+1년 2월 중순 사이에 걸친다
  const end = Date.UTC(year + 1, 1, 25);
  for (let t = Date.UTC(year, 0, 10); t <= end; t += 86_400_000) {
    const parts = fmt.formatToParts(new Date(t));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const monthStr = get('month'); // 윤달은 '4bis' 처럼 온다
    if (Number(get('relatedYear')) !== year || Number(get('day')) !== day) continue;
    if (parseInt(monthStr, 10) === month && monthStr.endsWith('bis') === isLeapMonth) return new Date(t);
  }
  return null;
}

export interface ComputedProfileMeta {
  zodiac: ZodiacAnimal;
  starSign: StarSign;
}

/**
 * 생년월일(YYYY-MM-DD)과 양력/음력 구분으로 띠·별자리를 계산한다.
 * 음력이면 양력으로 환산한 날짜로 별자리를 구하고, 환산할 수 없으면 error 를 돌려준다.
 */
export function computeFromBirth(
  birth: string,
  isLunar: boolean,
  isLeapMonth = false,
): { result: ComputedProfileMeta | null; error: string | null } {
  const ymd = parseYmd(birth);
  if (!ymd) return { result: null, error: null };

  if (!isLunar) {
    return {
      result: {
        zodiac: calculateZodiacAnimal(ymd.year, ymd.month, ymd.day, false),
        starSign: calculateStarSign(ymd.month, ymd.day),
      },
      error: null,
    };
  }

  const solar = lunarToSolar(ymd.year, ymd.month, ymd.day, isLeapMonth);
  if (!solar) {
    return {
      result: null,
      error: isLeapMonth
        ? '그 해에 해당 윤달이 없거나 없는 날짜예요. 윤달 선택을 확인해 주세요.'
        : '존재하지 않는 음력 날짜예요. 날짜를 다시 확인해 주세요.',
    };
  }
  return {
    result: {
      zodiac: calculateZodiacAnimal(ymd.year, ymd.month, ymd.day, true),
      starSign: calculateStarSign(solar.getUTCMonth() + 1, solar.getUTCDate()),
    },
    error: null,
  };
}
