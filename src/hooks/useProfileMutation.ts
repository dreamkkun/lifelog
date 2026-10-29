'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/routine.types';

/** user_profiles 를 user_id(PK) 기준으로 upsert 한다. 실패 시 에러 메시지, 성공 시 null. */
export function useProfileMutation() {
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = useCallback(async (profile: UserProfile): Promise<string | null> => {
    setIsSaving(true);
    const { error } = await createClient()
      .from('user_profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setIsSaving(false);
    return error ? error.message : null;
  }, []);

  return { saveProfile, isSaving };
}
