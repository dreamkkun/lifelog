'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { inputClass } from '@/components/ui/Field';

/** 로그인한 상태에서 비밀번호를 만들거나 바꾼다. 폰에서 메일 링크 없이 로그인할 때 쓴다. */
export default function PasswordForm() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError('비밀번호는 8자 이상으로 해 주세요.');
    if (password !== confirm) return setError('두 비밀번호가 서로 달라요.');

    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(
        /different|same/i.test(err.message)
          ? '지금 쓰는 비밀번호와 다른 비밀번호를 입력해 주세요.'
          : `비밀번호를 설정하지 못했어요: ${err.message}`,
      );
      return;
    }
    setPassword('');
    setConfirm('');
    toast('비밀번호를 설정했어요. 로그인 화면의 "비밀번호" 탭으로 들어올 수 있어요.');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        비밀번호를 만들어 두면 폰에서도 메일 링크 없이 바로 로그인할 수 있어요.
      </p>
      <label htmlFor="new-password" className="sr-only">
        새 비밀번호
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="새 비밀번호 (8자 이상)"
        className={inputClass}
      />
      <label htmlFor="confirm-password" className="sr-only">
        새 비밀번호 확인
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="새 비밀번호 확인"
        className={inputClass}
      />
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !password || !confirm}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
        비밀번호 설정
      </button>
    </form>
  );
}
