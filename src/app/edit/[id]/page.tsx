'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import DiaryForm from '@/components/forms/DiaryForm';
import BookForm from '@/components/forms/BookForm';
import LectureForm from '@/components/forms/LectureForm';
import MemoForm from '@/components/forms/MemoForm';
import { cn, TYPE_META } from '@/lib/utils';
import type { DatabaseRecord } from '@/types/database.types';

type LoadState = 'loading' | 'ready' | 'missing';

/** 쓴 기록 수정: 기록을 불러와 같은 유형의 입력 폼을 채워 보여준다 */
export default function EditRecordPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [record, setRecord] = useState<DatabaseRecord | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      // RLS 덕분에 내 기록만 조회된다. 남의 기록이거나 없는 id 면 null.
      const { data } = await supabase.from('records').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      setRecord((data as DatabaseRecord | null) ?? null);
      setState(data ? 'ready' : 'missing');
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const meta = record ? TYPE_META[record.type] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 돌아가기
      </Link>

      <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
        기록 수정
        {meta && <span className={cn('ml-2 font-sans text-sm font-semibold', meta.text)}>{meta.label}</span>}
      </h1>

      {state === 'loading' && <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" role="status" aria-label="불러오는 중" />}

      {state === 'missing' && (
        <div className="space-y-2 py-12 text-center">
          <p className="font-serif text-lg text-slate-700">기록을 찾을 수 없어요</p>
          <p className="text-sm text-slate-500">이미 삭제됐거나 내 기록이 아닐 수 있어요.</p>
          <Link href="/" className="inline-block pt-2 text-sm font-semibold text-slate-900 underline underline-offset-2">
            홈으로 가기
          </Link>
        </div>
      )}

      {state === 'ready' && record && userId && (
        <>
          {record.type === 'DIARY' && <DiaryForm key={record.id} userId={userId} initialRecord={record} />}
          {record.type === 'BOOK' && <BookForm key={record.id} userId={userId} initialRecord={record} />}
          {record.type === 'LECTURE' && <LectureForm key={record.id} userId={userId} initialRecord={record} />}
          {record.type === 'MEMO' && <MemoForm key={record.id} userId={userId} initialRecord={record} />}
        </>
      )}
    </div>
  );
}
