'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endOfWeek, startOfWeek } from 'date-fns';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRangeRecords } from '@/hooks/useMonthlyRecords';
import { useRangeTodos } from '@/hooks/useTodos';
import { deleteRecord } from '@/lib/records';
import { HomeView } from '@/components/home/HomeView';
import DailyOracleBanner from '@/components/dashboard/DailyOracleBanner';
import ProfileSetupModal from '@/components/dashboard/ProfileSetupModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/Toast';
import type { DatabaseRecord } from '@/types/database.types';
import { toISODate } from '@/lib/utils';

function HomeSkeleton() {
  return (
    <div
      className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 py-6"
      role="status"
    >
      <span className="sr-only">사용자 세션 확인 중...</span>
      <div className="h-8 w-40 rounded-lg bg-slate-200/70" />
      <div className="h-20 rounded-2xl bg-slate-200/70" />
      <div className="h-40 rounded-2xl bg-slate-200/70" />
    </div>
  );
}

function Home({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();

  const { profile, updateLocal } = useUserProfile(userId);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  const [range, setRange] = useState(() => ({
    start: toISODate(startOfWeek(new Date())),
    end: toISODate(endOfWeek(new Date())),
  }));
  const onRangeChange = useCallback(
    (start: string, end: string) =>
      setRange((r) =>
        r.start === start && r.end === end ? r : { start, end },
      ),
    [],
  );

  const { records, isLoading, error, removeLocal } = useRangeRecords(
    userId,
    range.start,
    range.end,
  );
  const {
    todos,
    error: todoError,
    addTodo,
    toggleTodo,
    removeTodo,
  } = useRangeTodos(userId, range.start, range.end);
  const todoActions = useMemo(
    () => ({ addTodo, toggleTodo, removeTodo }),
    [addTodo, toggleTodo, removeTodo],
  );

  const handleDelete = useCallback(
    async (record: DatabaseRecord) => {
      const err = await deleteRecord(record);
      if (err) {
        toast(`삭제 실패: ${err}`, 'error');
        return;
      }
      // Realtime DELETE 이벤트가 도착하면 이미 제거된 상태라 멱등. 연결이 끊긴 경우를 위한 보정.
      removeLocal(record.id);
      toast('삭제했어요.');
    },
    [removeLocal, toast],
  );

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
  };

  return (
    <>
      <HomeView
        banner={
          <DailyOracleBanner
            profile={profile}
            onOpenProfileSetup={() => setProfileOpen(true)}
          />
        }
        records={records}
        todos={todos}
        isLoading={isLoading}
        error={error ?? todoError}
        onRangeChange={onRangeChange}
        todoActions={todoActions}
        onDeleteRecord={handleDelete}
        onSignOut={signOut}
      />
      <ProfileSetupModal
        isOpen={profileOpen}
        onClose={closeProfile}
        userId={userId}
        initialProfile={profile}
        onProfileUpdated={updateLocal}
      />
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        if (!user) router.replace('/login');
        else setUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!userId) return <HomeSkeleton />;
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home userId={userId} />
    </Suspense>
  );
}
