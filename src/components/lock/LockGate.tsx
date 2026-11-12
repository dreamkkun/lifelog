'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Fingerprint, Loader2, LockKeyhole } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  LOCK_EVENT,
  LOCK_NOW_EVENT,
  RELOCK_AFTER_MS,
  cooldownSeconds,
  disableLock,
  isBiometricEnabled,
  isLockEnabled,
  isUnlockedThisSession,
  markLocked,
  markUnlocked,
  verifyBiometric,
  verifyPin,
} from '@/lib/appLock';

type State = 'checking' | 'locked' | 'open';

/** 로그인 전 화면은 잠그지 않는다 (보호할 기록이 아직 없다) */
const isExempt = (path: string) => path.startsWith('/login') || path.startsWith('/auth');

/** 앱 잠금이 켜져 있으면 열 때마다(그리고 잠시 떠났다 돌아오면) 해제 화면을 먼저 보여준다. */
export default function LockGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State>('checking');
  const [bio, setBio] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  const evaluate = useCallback(() => {
    setBio(isBiometricEnabled());
    if (!isLockEnabled()) return setState('open');
    setState(isUnlockedThisSession() ? 'open' : 'locked');
  }, []);

  useEffect(() => {
    evaluate();
    const onChange = () => evaluate();
    const onLockNow = () => {
      markLocked();
      setState(isLockEnabled() ? 'locked' : 'open');
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      hiddenAt.current = null;
      if (isLockEnabled() && away > RELOCK_AFTER_MS) {
        markLocked();
        setState('locked');
      }
    };
    window.addEventListener(LOCK_EVENT, onChange);
    window.addEventListener(LOCK_NOW_EVENT, onLockNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener(LOCK_EVENT, onChange);
      window.removeEventListener(LOCK_NOW_EVENT, onLockNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [evaluate]);

  const unlock = useCallback(() => {
    markUnlocked();
    setState('open');
  }, []);

  // PIN 을 잊었을 때: 이 기기에서 로그아웃하고 잠금 설정을 지운다. 다시 로그인하면 기록은 그대로다.
  const forgot = useCallback(async () => {
    if (isSupabaseConfigured) await createClient().auth.signOut();
    disableLock();
    setState('open');
    router.replace('/login');
  }, [router]);

  const exempt = isExempt(pathname);
  if (exempt) return <>{children}</>;
  if (state === 'open') return <>{children}</>;
  // 잠겨 있는 동안에는 기록 화면을 아예 그리지 않는다. 확인 중(checking)일 때도 빈 배경만 보인다.
  if (state === 'checking') return <div className="min-h-dvh" aria-hidden />;
  return <LockScreen biometric={bio} onUnlock={unlock} onForgot={forgot} />;
}

function LockScreen({
  biometric,
  onUnlock,
  onForgot,
}: {
  biometric: boolean;
  onUnlock: () => void;
  onForgot: () => void;
}) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(() => cooldownSeconds());
  const [bioTried, setBioTried] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setInterval(() => setWait(cooldownSeconds()), 500);
    return () => window.clearInterval(t);
  }, [wait]);

  const tryBiometric = useCallback(async () => {
    setError(null);
    if (await verifyBiometric()) onUnlock();
    else setError('지문·얼굴 인식을 확인하지 못했어요. 비밀번호로 열어 주세요.');
  }, [onUnlock]);

  // 열자마자 한 번 시도한다. 브라우저가 사용자 동작 없이는 막을 수 있어, 막히면 버튼으로 다시 누르게 한다.
  useEffect(() => {
    if (!biometric || bioTried) return;
    setBioTried(true);
    verifyBiometric().then((ok) => ok && onUnlock());
  }, [biometric, bioTried, onUnlock]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || wait > 0 || !pin) return;
    setBusy(true);
    setError(null);
    const ok = await verifyPin(pin);
    setBusy(false);
    if (ok) return onUnlock();
    setPin('');
    const remain = cooldownSeconds();
    setWait(remain);
    setError(remain > 0 ? '여러 번 틀려서 잠시 막았어요.' : '비밀번호가 맞지 않아요.');
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6">
      <div className="space-y-3">
        <LockKeyhole className="h-8 w-8 text-slate-700" aria-hidden />
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">LifeLog</h1>
        <p className="text-sm text-slate-500">잠겨 있어요. 비밀번호를 입력해 열어 주세요.</p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="lock-pin" className="sr-only">
          앱 잠금 비밀번호
        </label>
        <input
          id="lock-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoFocus
          maxLength={8}
          value={pin}
          disabled={wait > 0}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="숫자 비밀번호"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-lg tracking-[0.4em] text-slate-900 placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || wait > 0 || !pin}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {wait > 0 ? `${wait}초 후에 다시 시도해 주세요` : '열기'}
        </button>
        {biometric && (
          <button
            type="button"
            onClick={tryBiometric}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Fingerprint className="h-4 w-4" aria-hidden /> 지문·얼굴 인식으로 열기
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          if (window.confirm('이 기기에서 로그아웃하고 앱 잠금을 해제할까요?\n다시 로그인하면 기록은 그대로 보여요.')) onForgot();
        }}
        className="min-h-11 self-start text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
      >
        비밀번호를 잊었어요
      </button>
    </main>
  );
}
