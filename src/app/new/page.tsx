'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, GraduationCap, PenLine } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import DiaryForm from '@/components/forms/DiaryForm';
import BookForm from '@/components/forms/BookForm';
import LectureForm from '@/components/forms/LectureForm';
import { TabButton } from '@/components/ui/TabButton';

type TabMode = 'diary' | 'book' | 'lecture';

const TABS: { mode: TabMode; label: string; accent: string; icon: React.ElementType }[] = [
  { mode: 'diary', label: '일기 작성', accent: 'text-emerald-600', icon: PenLine },
  { mode: 'book', label: '독서 발췌', accent: 'text-indigo-600', icon: BookOpen },
  { mode: 'lecture', label: '강의 / OCR', accent: 'text-amber-600', icon: GraduationCap },
];

const isTabMode = (v: string | null): v is TabMode => TABS.some((t) => t.mode === v);

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-xl animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-6" role="status">
      <span className="sr-only">사용자 세션 확인 중...</span>
      <div className="h-9 rounded-lg bg-slate-100" />
      <div className="h-9 rounded-lg bg-slate-100" />
      <div className="h-40 rounded-lg bg-slate-100" />
      <div className="h-11 rounded-xl bg-slate-100" />
    </div>
  );
}

function NewRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 이 단일 진실 공급원: 뒤로가기/링크 공유 시 탭이 그대로 복원된다.
  const typeParam = searchParams.get('type');
  const activeTab: TabMode = isTabMode(typeParam) ? typeParam : 'diary';
  const dateParam = searchParams.get('date');
  const defaultDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

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

  const handleTabChange = (mode: TabMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', mode);
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> 메인으로 돌아가기
        </Link>
      </div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">새 기록</h1>

      <div role="tablist" aria-label="기록 유형" className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
        {TABS.map(({ mode, label, accent, icon: Icon }) => (
          <TabButton
            key={mode}
            id={`tab-${mode}`}
            panelId="new-record-panel"
            active={activeTab === mode}
            label={label}
            accent={accent}
            icon={<Icon className="h-4 w-4" aria-hidden />}
            onClick={() => handleTabChange(mode)}
          />
        ))}
      </div>

      <div id="new-record-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {!userId ? (
          <FormSkeleton />
        ) : (
          <>
            {activeTab === 'diary' && <DiaryForm userId={userId} defaultDate={defaultDate} />}
            {activeTab === 'book' && <BookForm userId={userId} defaultDate={defaultDate} />}
            {activeTab === 'lecture' && <LectureForm userId={userId} defaultDate={defaultDate} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewRecordContent />
    </Suspense>
  );
}
