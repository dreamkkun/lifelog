'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/routine.types';

/** 내 성향 프로필 조회. 아직 등록 전이면 profile 은 null. */
export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    createClient()
      .from('user_profiles')
      .select('user_id, mbti, zodiac_animal, star_sign')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile((data as UserProfile | null) ?? null);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateLocal = useCallback((p: UserProfile) => setProfile(p), []);

  return { profile, isLoading, updateLocal };
}
