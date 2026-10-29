'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 월간 보기의 날짜 상세. 모바일: 하단 바텀시트(open 일 때만) / PC(lg+): 우측 고정 패널. 내용은 children. */
export function DateDetailPanel({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* 바텀시트는 하단 탭바(z-50) 위에 겹쳐 열린다 */}
      {open && <div className="fixed inset-0 z-[55] bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        aria-label="날짜별 기록"
        className={cn(
          'z-[56] flex-col bg-white lg:z-auto',
          'fixed inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-2xl',
          // PC: 카드가 아니라 달력 옆의 한 면. 왼쪽 헤어라인만 둔다.
          'lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:rounded-none lg:border-l lg:border-slate-200 lg:bg-transparent lg:pb-0 lg:pl-6 lg:shadow-none',
          open ? 'flex' : 'hidden lg:flex',
        )}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1.5 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto overflow-x-hidden p-5 lg:px-0 lg:pt-0">{children}</div>
      </aside>
    </>
  );
}
