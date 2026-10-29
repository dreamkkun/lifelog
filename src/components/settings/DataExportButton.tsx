'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadJson, exportAllData } from '@/lib/backup';
import { useToast } from '@/components/ui/Toast';
import { todayISO } from '@/lib/utils';

/** 내 기록·할일·성향을 JSON 파일로 내려받는다 (개인 소장용 백업) */
export default function DataExportButton({ userId }: { userId: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const data = await exportAllData(userId);
      downloadJson(data, `lifelog-backup-${todayISO()}.json`);
      toast(`기록 ${data.records.length}건, 할일 ${data.todos.length}건을 내려받았어요.`);
    } catch (e) {
      toast(`백업하지 못했어요: ${e instanceof Error ? e.message : '알 수 없는 오류'}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
        {busy ? '모으는 중…' : '내 데이터 JSON으로 내려받기'}
      </button>
      <p className="text-xs leading-relaxed text-slate-500">
        기록, 할일, 성향이 한 파일로 저장돼요. 첨부 이미지 파일은 담기지 않고 경로만 들어가요.
      </p>
    </div>
  );
}
