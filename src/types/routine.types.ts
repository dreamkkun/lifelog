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
  birth_date?: string | null; // YYYY-MM-DD (schema.sql 재실행 후 저장)
  birth_is_lunar?: boolean;
  birth_is_leap?: boolean;
}

export interface TodoItem {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD
  content: string;
  is_completed: boolean;
  created_at: string;
  /** 반복 할 일에서 만들어졌으면 그 반복의 id */
  template_id?: string | null;
}

/** 오늘의 타로 하루치 기록 */
export interface TarotDay {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD
  card_id: number;
  morning_answer: string | null;
  mood: 'great' | 'good' | 'okay' | 'low' | 'rough' | null;
  evening_note: string | null;
  diary_id: string | null;
  created_at: string;
  updated_at: string;
}

/** 0=일 … 6=토 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 새 할 일에 붙이는 반복 설정. null 이면 한 번만 */
export type RepeatRule = { type: 'DAILY' } | { type: 'WEEKLY'; weekdays: Weekday[] };

export interface TodoTemplate {
  id: string;
  user_id: string;
  content: string;
  repeat_type: 'DAILY' | 'WEEKLY';
  weekdays: number[];
  start_date: string; // YYYY-MM-DD
  /** "이 날만 삭제"한 날짜들 (schema.sql 재실행 후 저장) */
  skipped_dates?: string[];
  is_active: boolean;
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

/** 알림 설정. evening_enabled=false 는 사용자가 명시적으로 끈 것, evening_time=null 은 시간 미설정(기본 21:00). */
export interface NotificationSettings {
  user_id: string;
  evening_enabled: boolean;
  evening_time: string | null; // 'HH:MM'
  time_zone: string;
  last_sent_date: string | null; // YYYY-MM-DD
  ignored_streak: number;
  first_notice_sent: boolean;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

/** 복용 중인 영양제. remind 가 true 면 remind_time(HH:MM)에 아직 안 먹었을 때 알려 준다. */
export interface Supplement {
  id: string;
  user_id: string;
  name: string;
  catalog_key: string | null;
  dose: string | null;
  remind: boolean;
  remind_time: string;
  time_zone: string;
  start_date: string; // YYYY-MM-DD
  is_active: boolean;
  last_notified_date: string | null;
  created_at: string;
}

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  target_date: string; // YYYY-MM-DD
  taken_at: string;
}
