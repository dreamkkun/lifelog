import { createClient } from '@/lib/supabase/client';
import type { DatabaseRecord, RecordInsertInput } from '@/types/database.types';

const BUCKET = 'record-images';

/** 기록과 첨부 이미지(Storage)를 함께 삭제한다. 실패 시 에러 메시지, 성공 시 null. */
export async function deleteRecord(record: DatabaseRecord): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('records').delete().eq('id', record.id);
  if (error) return error.message;
  if (record.image_urls?.length) {
    await supabase.storage.from(BUCKET).remove(record.image_urls);
  }
  return null;
}

export type RecordPayload = RecordInsertInput & { user_id: string };

/**
 * 새 기록이면 INSERT, id 가 있으면 그 기록을 UPDATE 한다.
 * 수정 시 작성자(user_id)와 유형은 바꾸지 않는다. 실패하면 에러 메시지, 성공하면 null.
 */
export async function saveRecord(payload: RecordPayload, id?: string): Promise<string | null> {
  const supabase = createClient();

  if (!id) {
    const { error } = await supabase.from('records').insert(payload);
    return error ? error.message : null;
  }

  const { user_id: _userId, type: _type, ...fields } = payload;
  const { data, error } = await supabase
    .from('records')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  if (error) return error.message;
  // RLS 로 막히거나 이미 지워진 기록이면 오류 없이 0건이 갱신된다
  if (!data || data.length === 0) return '수정할 기록을 찾지 못했어요. 삭제됐거나 권한이 없을 수 있어요.';
  return null;
}

/** 수정하면서 빠진 첨부 이미지를 Storage 에서 지운다 (실패해도 수정 결과에는 영향 없음). */
export async function removeImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await createClient().storage.from(BUCKET).remove(paths);
}
