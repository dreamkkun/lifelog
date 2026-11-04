'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { useArchiveRecords, type FilterType } from '@/hooks/useArchiveRecords';
import { deleteRecord } from '@/lib/records';
import { ArchiveFilterTabs } from '@/components/records/ArchiveFilterTabs';
import { ArchiveSearchBar } from '@/components/records/ArchiveSearchBar';
import { ArchiveItemCard } from '@/components/records/ArchiveItemCard';
import { useToast } from '@/components/ui/Toast';
import type { DatabaseRecord } from '@/types/database.types';

const TYPE_PARAMS: Record<string, FilterType> = { diary: 'DIARY', book: 'BOOK', lecture: 'LECTURE', memo: 'MEMO' };

function ArchiveList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FilterType>(TYPE_PARAMS[searchParams.get('type') ?? ''] ?? 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

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

  const { records, total, isLoading, error, hasMore, loadMore, removeLocal } = useArchiveRecords(
    userId,
    selectedType,
    debouncedQuery,
  );

  // 입력 후 디바운스가 끝나기 전, 또는 조회 중이면 "검색 중"
  const isSearching = searchQuery !== debouncedQuery || isLoading;
  const isFiltered = debouncedQuery.trim() !== '';

  const handleTypeChange = (v: FilterType) => {
    setSelectedType(v); // 검색어는 유지
    // 링크 공유·뒤로가기를 위해 URL 에도 반영
    const url = new URL(window.location.href);
    if (v === 'ALL') url.searchParams.delete('type');
    else url.searchParams.set('type', v.toLowerCase());
    window.history.replaceState(null, '', url.toString());
    window.scrollTo({ top: 0 });
  };

  const handleDelete = useCallback(
    async (record: DatabaseRecord) => {
      const err = await deleteRecord(record);
      if (err) {
        toast(`삭제 중 오류가 발생했습니다: ${err}`, 'error');
        return;
      }
      removeLocal(record.id); // 즉시 제거
      toast('삭제했어요.');
    },
    [removeLocal, toast],
  );

  // 무한 스크롤: 바닥 센티널이 보이면 20개 더
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || isLoading) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoading, loadMore, records.length]);

  if (!userId) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-label="세션 확인 중" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="캘린더 대시보드로 돌아가기"
            className="-ml-2 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">전체 아카이브</h1>
            <p className="text-xs text-slate-500">누적된 일기, 독서 발췌, 강의 필기 탐색</p>
          </div>
        </div>
        <Link
          href="/new?type=diary"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden /> 새 기록 작성
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <ArchiveFilterTabs value={selectedType} onChange={handleTypeChange} controls="archive-feed" />
        <ArchiveSearchBar value={searchQuery} onChange={setSearchQuery} isSearching={isSearching} />
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500" aria-live="polite">
        <span>
          {isFiltered ? '검색 결과' : '전체'} <strong className="font-semibold text-slate-700">{total}</strong>건
        </span>
        {isSearching && (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> 검색 중...
          </span>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">기록을 불러오지 못했어요: {error}</p>}

      <div id="archive-feed" role="tabpanel" className="border-t border-slate-200">
        {records.length === 0 && !isLoading ? (
          <div className="space-y-2 py-20 text-center">
            <p className="font-serif text-base text-slate-700">찾는 기록이 없어요</p>
            <p className="text-xs text-slate-500">검색어를 줄이거나 다른 유형을 골라 보세요.</p>
          </div>
        ) : (
          records.map((item) => <ArchiveItemCard key={item.id} item={item} onDelete={handleDelete} />)
        )}
      </div>

      <div ref={sentinel} className="flex h-10 items-center justify-center text-slate-500">
        {isLoading && records.length > 0 && <Loader2 className="h-5 w-5 animate-spin" aria-label="불러오는 중" />}
      </div>
    </div>
  );
}

export default function ArchiveListPage() {
  return (
    <Suspense>
      <ArchiveList />
    </Suspense>
  );
}
