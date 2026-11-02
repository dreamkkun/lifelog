import { cn } from '@/lib/utils';
import type { FilterType } from '@/hooks/useArchiveRecords';

const TABS: { label: string; value: FilterType }[] = [
  { label: '전체', value: 'ALL' },
  { label: '일기', value: 'DIARY' },
  { label: '독서', value: 'BOOK' },
  { label: '강의', value: 'LECTURE' },
  { label: '메모', value: 'MEMO' },
];

export function ArchiveFilterTabs({
  value,
  onChange,
  controls,
}: {
  value: FilterType;
  onChange: (v: FilterType) => void;
  /** 탭이 제어하는 목록 영역의 id */
  controls: string;
}) {
  return (
    <div role="tablist" aria-label="기록 유형 필터" className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          aria-controls={controls}
          onClick={() => onChange(tab.value)}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-xs transition-colors',
            value === tab.value
              ? 'bg-slate-900 font-semibold text-white'
              : 'bg-slate-100 font-medium text-slate-600 hover:bg-slate-200',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
