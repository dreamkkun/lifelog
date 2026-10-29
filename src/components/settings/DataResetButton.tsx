'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { resetAllData } from '@/lib/backup';
import { useToast } from '@/components/ui/Toast';

const CONFIRM_WORD = '삭제';

/** 내 데이터 전체 삭제. 되돌릴 수 없어서 확인 문구를 직접 입력해야 활성화된다. */
export default function DataResetButton({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (typed !== CONFIRM_WORD || busy) return;
    setBusy(true);
    const err = await resetAllData(userId);
    setBusy(false);
    if (err) {
      toast(`삭제하지 못했어요: ${err}`, 'error');
      return;
    }
    toast('모든 데이터를 삭제했어요.');
    router.push('/');
    router.refresh();
  };

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> 내 데이터 모두 삭제
        </button>
        <p className="text-xs leading-relaxed text-slate-500">
          기록, 할일, 성향, 첨부 이미지를 지워요. 로그인 계정은 남아요.
        </p>
      </div>
    );
  }

  return (
    <div role="alertdialog" aria-labelledby="reset-title" className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
      <h3 id="reset-title" className="text-sm font-semibold text-rose-700">
        정말 모두 삭제할까요?
      </h3>
      <p className="text-xs leading-relaxed text-slate-600">
        삭제한 기록과 이미지는 되돌릴 수 없어요. 필요하면 먼저 JSON으로 내려받으세요. 계속하려면 아래 칸에{' '}
        <strong className="text-rose-700">{CONFIRM_WORD}</strong>를 입력하세요.
      </p>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-label={`확인을 위해 ${CONFIRM_WORD} 입력`}
        placeholder={CONFIRM_WORD}
        className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped('');
          }}
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={run}
          disabled={typed !== CONFIRM_WORD || busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? '삭제하는 중…' : '영구 삭제'}
        </button>
      </div>
    </div>
  );
}
