'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'success' | 'warning' | 'error';
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const icons = { success: CheckCircle2, warning: AlertTriangle, error: XCircle };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-[70] md:bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg',
                t.kind === 'success' && 'bg-slate-800',
                t.kind === 'warning' && 'bg-amber-600',
                t.kind === 'error' && 'bg-red-600',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
