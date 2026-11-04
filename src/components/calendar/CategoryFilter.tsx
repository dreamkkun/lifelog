import Link from 'next/link';
import type { RecordType } from '@/types/database.types';
import { cn, TYPE_META } from '@/lib/utils';

export type HomeFilter = RecordType | 'TODO' | 'ALL';

const CHIPS: { value: HomeFilter; label: string; dot?: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'TODO', label: '할일', dot: 'bg-slate-400' },
  { value: 'DIARY', label: '일기', dot: TYPE_META.DIARY.dot },
  { value: 'BOOK', label: '독서', dot: TYPE_META.BOOK.dot },
  { value: 'LECTURE', label: '강의', dot: TYPE_META.LECTURE.dot },
  { value: 'MEMO', label: '메모', dot: TYPE_META.MEMO.dot },
];

/** 종류별 보기. 주간/월간 모두에 적용되고, 기록 종류는 전체 목록으로 이어진다. */
export function CategoryFilter({ value, onChange }: { value: HomeFilter; onChange: (v: HomeFilter) => void }) {
  const listHref = value === 'ALL' ? '/list' : `/list?type=${value.toLowerCase()}`;
  const current = CHIPS.find((c) => c.value === value);
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="기록 종류 필터" className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={value === c.value}
            onClick={() => onChange(c.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              value === c.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {c.dot && <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />}
            {c.label}
          </button>
        ))}
      </div>
      {value !== 'TODO' && (
        <Link
          href={listHref}
          className="ml-auto hidden shrink-0 whitespace-nowrap text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline sm:block"
        >
          {value === 'ALL' ? '전체 목록' : `${current?.label} 전체 보기`}
        </Link>
      )}
    </div>
  );
}
