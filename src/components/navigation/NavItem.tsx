import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  /** 중앙 플로팅 액션 버튼(FAB) 스타일 */
  isAction?: boolean;
  /** 아이콘 우상단 숫자 뱃지 (0 이하이면 숨김) */
  badge?: number;
}

export function NavItem({ label, href, icon: Icon, active, isAction, badge }: NavItemProps) {
  if (isAction) {
    return (
      <div className="flex -translate-y-3 justify-center">
        <Link
          href={href}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 transition-all hover:bg-slate-800 active:scale-95',
            active && 'ring-2 ring-slate-900 ring-offset-2',
          )}
        >
          <Icon className="h-6 w-6 stroke-[2.5]" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex select-none flex-col items-center justify-center py-1 transition-colors',
        active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600',
      )}
    >
      <div className="relative">
        <Icon className={cn('h-5 w-5', active ? 'stroke-[2.2]' : 'stroke-2')} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
        {active && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-slate-900" />}
      </div>
      <span className={cn('mt-1 text-[10px] tracking-tight', active ? 'font-bold' : 'font-medium')}>{label}</span>
    </Link>
  );
}
