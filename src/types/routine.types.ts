export type MBTIType =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export type ZodiacAnimal = '쥐' | '소' | '호랑이' | '토끼' | '용' | '뱀' | '말' | '양' | '원숭이' | '닭' | '개' | '돼지';

export type StarSign =
  | '양자리' | '황소자리' | '쌍둥이자리' | '게자리'
  | '사자자리' | '처녀자리' | '천칭자리' | '전갈자리'
  | '사수자리' | '염소자리' | '물병자리' | '물고기자리';

export interface UserProfile {
  user_id: string;
  mbti: MBTIType;
  zodiac_animal: ZodiacAnimal;
  star_sign: StarSign;
}

export interface TodoItem {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD
  content: string;
  is_completed: boolean;
  created_at: string;
}

export type QuoteCategory = '전략·통찰' | '성찰·회복' | '원칙·실행' | '도전·모험' | '소통·혁신';

export interface QuoteData {
  id: number;
  quote: string;
  author: string;
  actionAdvice: string;
  keywords: readonly string[];
  category: QuoteCategory;
}
