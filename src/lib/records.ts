import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord } from '@/types/database.types';

/** 기록과 첨부 이미지(Storage)를 함께 삭제한다. 실패 시 에러 메시지, 성공 시 null. */
export async function deleteRecord(record: DatabaseRecord): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('records').delete().eq('id', record.id);
  if (error) return error.message;
  if (record.image_urls?.length) {
    await supabase.storage.from('record-images').remove(record.image_urls);
  }
  return null;
}
