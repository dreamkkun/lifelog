'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileSetupForm from '@/components/dashboard/ProfileSetupForm';
import { useToast } from '@/components/ui/Toast';
import DataExportButton from '@/components/settings/DataExportButton';
import DataResetButton from '@/components/settings/DataResetButton';

function ProfileSettings({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { profile, isLoading } = useUserProfile(userId);

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  return (
    <ProfileSetupForm
      userId={userId}
      initialProfile={profile}
      submitLabel="저장하기"
      onSaved={() => {
        toast('성향을 저장했어요.');
        router.push('/');
      }}
    />
  );
}

export default function ProfileSettingsPage() {
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

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 메인으로 돌아가기
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">나의 성향</h1>
        <p className="mt-1 text-sm text-slate-500">생년월일과 MBTI로 매일 나에게 맞는 한마디를 골라 드려요.</p>
      </div>
      {userId ? <ProfileSettings userId={userId} /> : <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />}

      {userId && (
        <section aria-labelledby="data-title" className="space-y-5 border-t border-slate-200 pt-6">
          <h2 id="data-title" className="font-serif text-lg font-semibold text-slate-900">
            내 데이터
          </h2>
          <DataExportButton userId={userId} />
          <DataResetButton userId={userId} />
        </section>
      )}
    </div>
  );
}
