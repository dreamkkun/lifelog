'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Cloud, CloudOff } from 'lucide-react';
import { useOnline } from '@/hooks/useBackupStatus';
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
import { usePinnedIdeas } from '@/hooks/usePinnedIdeas';
import DailyTarot from '@/components/tarot/DailyTarot';
import PinnedIdeasSection from '@/components/dashboard/PinnedIdeasSection';
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

interface AccountInfo {
  id: string;
  email: string;
  nickname: string;
}

/** 지금 로그인한 계정 표시: 별명이 있으면 별명과 이메일, 없으면 별명 정하기 안내 */
function AccountLine({ account }: { account: AccountInfo }) {
  const online = useOnline();
  return (
    <div className="flex items-baseline justify-between gap-3">
      <AccountName account={account} />
      <Link
        href="/settings/profile"
        aria-label={online ? '클라우드에 저장 중. 백업 상태 보기' : '오프라인. 백업 상태 보기'}
        className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${online ? 'text-slate-500 hover:text-slate-800' : 'text-amber-700'}`}
      >
        {online ? <Cloud className="h-3.5 w-3.5" aria-hidden /> : <CloudOff className="h-3.5 w-3.5" aria-hidden />}
        {online ? '클라우드 저장' : '오프라인'}
      </Link>
    </div>
  );
}

function AccountName({ account }: { account: AccountInfo }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 px-1 text-sm text-slate-600">
      {account.nickname ? (
        <>
          <strong className="font-semibold text-slate-900">{account.nickname}</strong>
          <span className="text-xs text-slate-500">{account.email}</span>
        </>
      ) : (
        <>
          <span className="text-xs text-slate-500">{account.email}</span>
          <Link href="/settings/profile" className="text-xs font-semibold text-slate-700 underline underline-offset-2">
            별명 정하기
          </Link>
        </>
      )}
    </p>
  );
}

function Home({ userId, account }: { userId: string; account: AccountInfo }) {
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

  const { records, isLoading, error, removeLocal, patchLocal } = useRangeRecords(
    userId,
    range.start,
    range.end,
  );
  const {
    todos,
    error: todoError,
    addTodo,
    toggleTodo,
    updateTodo,
    removeTodo,
    stopRepeat,
    skipOnce,
    makeRepeat,
  } = useRangeTodos(userId, range.start, range.end);
  const todoActions = useMemo(
    () => ({ addTodo, toggleTodo, updateTodo, removeTodo, stopRepeat, skipOnce, makeRepeat }),
    [addTodo, toggleTodo, updateTodo, removeTodo, stopRepeat, skipOnce, makeRepeat],
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

  const { pinned, setPin } = usePinnedIdeas(userId);
  const handleTogglePin = useCallback(
    async (record: DatabaseRecord) => {
      const next = !record.is_pinned;
      const err = await setPin(record, next);
      if (err) {
        toast(err, 'error');
        return;
      }
      patchLocal(record.id, { is_pinned: next });
    },
    [setPin, patchLocal, toast],
  );

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
  };

  return (
    <>
      <HomeView
        banner={
          <div className="space-y-6">
            <AccountLine account={account} />
            <DailyOracleBanner
              profile={profile}
              onOpenProfileSetup={() => setProfileOpen(true)}
            />
            <DailyTarot userId={userId} />
            <PinnedIdeasSection items={pinned} onUnpin={handleTogglePin} />
          </div>
        }
        records={records}
        todos={todos}
        isLoading={isLoading}
        error={error ?? todoError}
        onRangeChange={onRangeChange}
        todoActions={todoActions}
        onDeleteRecord={handleDelete}
        onTogglePin={handleTogglePin}
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
  const [account, setAccount] = useState<AccountInfo | null>(null);

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
        if (!user) {
          router.replace('/login');
          return;
        }
        const nickname = user.user_metadata?.nickname;
        setAccount({ id: user.id, email: user.email ?? '', nickname: typeof nickname === 'string' ? nickname : '' });
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!account) return <HomeSkeleton />;
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home userId={account.id} account={account} />
    </Suspense>
  );
}
