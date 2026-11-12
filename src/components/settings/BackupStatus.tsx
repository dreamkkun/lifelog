'use client';

import { Cloud, CloudOff, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useBackupStatus, useOnline } from '@/hooks/useBackupStatus';

const when = (iso: string | null) =>
  iso ? `${format(parseISO(iso), 'M월 d일 HH:mm', { locale: ko })} (${formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ko })})` : null;

/** 클라우드 저장 상태: 연결 여부, 클라우드에 들어 있는 양, 마지막 저장 시각, 마지막 JSON 내려받기 */
export default function BackupStatus({ userId }: { userId: string }) {
  const online = useOnline();
  const { recordCount, todoCount, lastSavedAt, lastExportAt, loading, failed, refresh } = useBackupStatus(userId);

  const state = !online
    ? { icon: <CloudOff className="h-4 w-4" aria-hidden />, text: '오프라인이에요. 연결되면 다시 저장할 수 있어요.', tone: 'text-amber-700' }
    : failed
      ? { icon: <TriangleAlert className="h-4 w-4" aria-hidden />, text: '클라우드 상태를 불러오지 못했어요.', tone: 'text-rose-600' }
      : { icon: <Cloud className="h-4 w-4" aria-hidden />, text: '기록은 저장할 때마다 클라우드에 바로 저장돼요.', tone: 'text-emerald-700' };

  return (
    <div className="space-y-3">
      <p role="status" className={`flex items-start gap-2 text-sm font-semibold ${state.tone}`}>
        <span className="mt-0.5 shrink-0">{state.icon}</span>
        {state.text}
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">클라우드에 있는 기록</dt>
        <dd className="text-slate-800">
          {loading && recordCount === null ? '불러오는 중…' : recordCount === null ? '-' : `기록 ${recordCount}건 · 할일 ${todoCount ?? 0}건`}
        </dd>
        <dt className="text-slate-500">마지막 저장</dt>
        <dd className="text-slate-800">{when(lastSavedAt) ?? (loading ? '불러오는 중…' : '아직 저장한 기록이 없어요')}</dd>
        <dt className="text-slate-500">내려받은 백업 파일</dt>
        <dd className="text-slate-800">{when(lastExportAt) ?? '아직 내려받지 않았어요'}</dd>
      </dl>

      <button
        type="button"
        onClick={refresh}
        disabled={loading || !online}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
        상태 새로고침
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        클라우드(Supabase)에 저장되는 것이라 폰과 PC가 같은 기록을 봐요. 서비스 장애나 실수로 지운 경우에 대비해, 소중한 기록은 아래 JSON
        내려받기로 따로 보관해 두세요.
      </p>
    </div>
  );
}
