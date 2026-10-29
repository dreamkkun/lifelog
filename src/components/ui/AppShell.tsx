'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, List, LogOut, PlusCircle } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: '캘린더', icon: CalendarDays },
  { href: '/list', label: '목록', icon: List },
  { href: '/new', label: '새 기록', icon: PlusCircle },
];

export function AppShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
  };

  return (
    <AuthGuard>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className={cn('mx-auto flex items-center gap-1 px-4 py-2', wide ? 'max-w-6xl' : 'max-w-2xl')}>
          <span className="mr-auto text-sm font-bold text-slate-900">LifeLog</span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm',
                pathname === href ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={signOut}
            aria-label="로그아웃"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </header>
      <main className={cn('mx-auto p-4', wide ? 'max-w-6xl' : 'max-w-2xl')}>{children}</main>
    </AuthGuard>
  );
}
