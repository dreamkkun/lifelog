'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/routine.types';

/** user_profiles 를 user_id(PK) 기준으로 upsert 한다. 실패 시 에러 메시지, 성공 시 null. */
export function useProfileMutation() {
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = useCallback(async (profile: UserProfile): Promise<string | null> => {
    setIsSaving(true);
    const supabase = createClient();
    const upsert = (row: UserProfile) =>
      supabase.from('user_profiles').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    let { error } = await upsert(profile);
    // 생년월일 열이 아직 없는 DB(schema.sql 재실행 전)면 그 열만 빼고 다시 저장한다
    if (error && /birth_|schema cache|does not exist/i.test(error.message)) {
      const { birth_date: _d, birth_is_lunar: _l, birth_is_leap: _p, ...legacy } = profile;
      ({ error } = await upsert(legacy));
    }
    setIsSaving(false);
    return error ? error.message : null;
  }, []);

  return { saveProfile, isSaving };
}
