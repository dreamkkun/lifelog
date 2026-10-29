import type { TodoItem, UserProfile } from '@/types/routine.types';

export type RecordType = 'DIARY' | 'BOOK' | 'LECTURE';
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
  lecture_title?: string | null;
  speaker?: string | null;
  ocr_extracted_text?: string | null;
  weather?: Weather | null;
  created_at: string;
  updated_at: string;
}

export type RecordInsertInput = Omit<DatabaseRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// supabase-js 제네릭 요구사항(Row 가 Record<string, unknown> 에 대입 가능)을 맞추기 위해 매핑 타입 사용
type Row = { [K in keyof DatabaseRecord]: DatabaseRecord[K] };
type TodoRow = { [K in keyof TodoItem]: TodoItem[K] };
type ProfileRow = {
  user_id: string;
  mbti: UserProfile['mbti'];
  zodiac_animal: UserProfile['zodiac_animal'];
  star_sign: UserProfile['star_sign'];
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
