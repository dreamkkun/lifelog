import type { NotificationSettings, PushSubscriptionRow, Supplement, SupplementLog, TarotDay, TodoItem, TodoTemplate, UserProfile } from '@/types/routine.types';

export type RecordType = 'DIARY' | 'BOOK' | 'LECTURE' | 'MEMO';
export type Weather = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY';

export interface DatabaseRecord {
  id: string;
  user_id: string;
  type: RecordType;
  target_date: string; // YYYY-MM-DD
  content: string;
  image_urls: string[]; // Storage 객체 경로 ({user_id}/{date}_{ts}.webp)
  book_title?: string | null;
  book_author?: string | null;
  quote?: string | null;
  page_number?: number | null;
  book_total_pages?: number | null; // 책의 총 페이지 수
  book_genre?: string | null; // 분야(소설, 경제/경영 …)
  lecture_title?: string | null;
  speaker?: string | null;
  ocr_extracted_text?: string | null;
  weather?: Weather | null;
  // 메모/아이디어 전용
  memo_title?: string | null;
  is_pinned?: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type RecordInsertInput = Omit<DatabaseRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// supabase-js 제네릭 요구사항(Row 가 Record<string, unknown> 에 대입 가능)을 맞추기 위해 매핑 타입 사용
type Row = { [K in keyof DatabaseRecord]: DatabaseRecord[K] };
type TodoRow = { [K in keyof TodoItem]: TodoItem[K] };
type TemplateRow = { [K in keyof TodoTemplate]: TodoTemplate[K] };
type TarotRow = { [K in keyof TarotDay]: TarotDay[K] };
type NotifRow = { [K in keyof NotificationSettings]: NotificationSettings[K] };
type PushSubRow = { [K in keyof PushSubscriptionRow]: PushSubscriptionRow[K] };
type SuppRow = { [K in keyof Supplement]: Supplement[K] };
type SuppLogRow = { [K in keyof SupplementLog]: SupplementLog[K] };
type ProfileRow = {
  user_id: string;
  mbti: UserProfile['mbti'];
  zodiac_animal: UserProfile['zodiac_animal'];
  star_sign: UserProfile['star_sign'];
  birth_date?: string | null;
  birth_is_lunar?: boolean;
  birth_is_leap?: boolean;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      records: {
        Row: Row;
        Insert: RecordInsertInput & Partial<Pick<Row, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Row>;
        Relationships: [];
      };
      todos: {
        Row: TodoRow;
        Insert: Pick<TodoRow, 'content'> & Partial<Omit<TodoRow, 'content'>>;
        Update: Partial<TodoRow>;
        Relationships: [];
      };
      todo_templates: {
        Row: TemplateRow;
        Insert: Pick<TemplateRow, 'content' | 'repeat_type'> & Partial<Omit<TemplateRow, 'content' | 'repeat_type'>>;
        Update: Partial<TemplateRow>;
        Relationships: [];
      };
      tarot_days: {
        Row: TarotRow;
        Insert: Pick<TarotRow, 'target_date' | 'card_id'> & Partial<Omit<TarotRow, 'target_date' | 'card_id'>>;
        Update: Partial<TarotRow>;
        Relationships: [];
      };
      notification_settings: {
        Row: NotifRow;
        Insert: Pick<NotifRow, 'user_id'> & Partial<Omit<NotifRow, 'user_id'>>;
        Update: Partial<NotifRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubRow;
        Insert: Pick<PushSubRow, 'endpoint' | 'p256dh' | 'auth'> & Partial<Omit<PushSubRow, 'endpoint' | 'p256dh' | 'auth'>>;
        Update: Partial<PushSubRow>;
        Relationships: [];
      };
      supplements: {
        Row: SuppRow;
        Insert: Pick<SuppRow, 'name'> & Partial<Omit<SuppRow, 'name'>>;
        Update: Partial<SuppRow>;
        Relationships: [];
      };
      supplement_logs: {
        Row: SuppLogRow;
        Insert: Pick<SuppLogRow, 'supplement_id' | 'target_date'> & Partial<Omit<SuppLogRow, 'supplement_id' | 'target_date'>>;
        Update: Partial<SuppLogRow>;
        Relationships: [];
      };
      user_profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> & Partial<Pick<ProfileRow, 'created_at' | 'updated_at'>>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { record_type: RecordType };
    CompositeTypes: { [_ in never]: never };
  };
}
