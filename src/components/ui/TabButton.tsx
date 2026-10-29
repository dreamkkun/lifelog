import { cn } from '@/lib/utils';

interface TabButtonProps {
  id: string;
  panelId: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  /** 선택됐을 때 라벨/아이콘에 적용할 포인트 컬러 (예: 'text-emerald-600') */
  accent: string;
  onClick: () => void;
}

export function TabButton({ id, panelId, active, label, icon, accent, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs transition-all sm:text-sm',
        active ? cn('bg-white text-slate-900 shadow-sm font-semibold', accent) : 'text-slate-500 hover:text-slate-800 font-medium',
      )}
    >
      {icon}
      <span className={active ? 'text-slate-900' : undefined}>{label}</span>
    </button>
  );
}
