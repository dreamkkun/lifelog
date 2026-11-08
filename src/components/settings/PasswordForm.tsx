'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { inputClass } from '@/components/ui/Field';

/** 비밀번호를 만들었는지 계정(user_metadata)에 표시해 두는 키. 로그인 화면에서 비밀번호로 들어온 경우에도 기록된다. */
export const PASSWORD_FLAG = 'has_password';

/** 로그인한 상태에서 비밀번호를 만들거나 바꾼다. 폰에서 메일 링크 없이 로그인할 때 쓴다. */
export default function PasswordForm() {
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [changing, setChanging] = useState(false); // 이미 설정된 상태에서 변경 폼을 열었는지
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled) return;
        setHasPassword(user?.user_metadata?.[PASSWORD_FLAG] === true);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError('비밀번호는 8자 이상으로 해 주세요.');
    if (password !== confirm) return setError('두 비밀번호가 서로 달라요.');

    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password, data: { [PASSWORD_FLAG]: true } });
    setBusy(false);
    if (err) {
      setError(
        /different|same/i.test(err.message)
          ? '지금 쓰는 비밀번호와 다른 비밀번호를 입력해 주세요.'
          : `비밀번호를 설정하지 못했어요: ${err.message}`,
      );
      return;
    }
    const wasSet = hasPassword;
    setPassword('');
    setConfirm('');
    setHasPassword(true);
    setChanging(false);
    toast(wasSet ? '비밀번호를 바꿨어요.' : '비밀번호를 설정했어요. 로그인 화면의 "비밀번호" 탭으로 들어올 수 있어요.');
  };

  if (!ready) return <div className="h-16 animate-pulse rounded-xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  if (hasPassword && !changing) {
    return (
      <div className="space-y-3">
        <p role="status" className="flex items-start gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">비밀번호가 설정되어 있어요.</strong>{' '}
            <span className="text-slate-500">로그인 화면의 &ldquo;비밀번호&rdquo; 탭에서 이메일과 함께 입력하면 돼요.</span>
          </span>
        </p>
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <KeyRound className="h-4 w-4" aria-hidden />
          비밀번호 변경
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        {hasPassword
          ? '새 비밀번호를 입력하면 지금 비밀번호를 바꿔요.'
          : '아직 비밀번호가 없어요. 만들어 두면 폰에서도 메일 링크 없이 바로 로그인할 수 있어요.'}
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
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !password || !confirm}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
          {hasPassword ? '비밀번호 변경' : '비밀번호 설정'}
        </button>
        {hasPassword && (
          <button
            type="button"
            onClick={() => {
              setChanging(false);
              setError(null);
            }}
            className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
