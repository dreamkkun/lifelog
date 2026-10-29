import { Loader2, Search, X } from 'lucide-react';

export function ArchiveSearchBar({
  value,
  onChange,
  isSearching,
}: {
  value: string;
  onChange: (v: string) => void;
  isSearching: boolean;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="본문, 도서명, 강의명, 저자 검색..."
        aria-label="기록 검색"
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-14 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
      />
      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="검색 중" />}
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label="검색어 지우기" className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
