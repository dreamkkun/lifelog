'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, ListFilter, Plus } from 'lucide-react';
import { NavItem } from './NavItem';

const NAV_ITEMS = [
  { label: '캘린더', href: '/', icon: Calendar },
  { label: '기록 추가', href: '/new?type=diary', icon: Plus, isAction: true },
  { label: '아카이브', href: '/list', icon: ListFilter },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 로그인/인증 경로에서는 렌더링하지 않음
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <nav
      aria-label="모바일 하단 내비게이션"
      // md 이상에서는 레이아웃에서 완전히 제거. 높이는 min-h-[64px] + 홈 인디케이터만큼 pb-safe 로 증가.
      className="fixed bottom-0 left-0 right-0 z-50 block h-auto min-h-[64px] border-t border-slate-200/80 bg-white/95 pb-safe pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-3 items-center px-4">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href.split('?')[0]} />
        ))}
      </div>
    </nav>
  );
}
