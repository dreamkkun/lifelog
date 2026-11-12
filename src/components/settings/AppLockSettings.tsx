'use client';

import { useCallback, useEffect, useState } from 'react';
import { Fingerprint, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { inputClass } from '@/components/ui/Field';
import {
  LOCK_EVENT,
  LOCK_NOW_EVENT,
  PIN_MAX,
  PIN_MIN,
  disableBiometric,
  disableLock,
  enableBiometric,
  isBiometricEnabled,
  isBiometricSupported,
  isLockEnabled,
  isValidPin,
  setPin,
  verifyPin,
} from '@/lib/appLock';

type Mode = 'idle' | 'enable' | 'change' | 'disable';

const btnPrimary =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40';
const btnGhost =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40';

/** 설정의 앱 잠금: 숫자 비밀번호와 (기기가 지원하면) 지문·얼굴 인식. 이 기기에만 적용된다. */
export default function AppLockSettings() {
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setEnabled(isLockEnabled());
    setBioOn(isBiometricEnabled());
  }, []);

  useEffect(() => {
    refresh();
    isBiometricSupported().then((ok) => {
      setBioSupported(ok);
      setReady(true);
    });
    window.addEventListener(LOCK_EVENT, refresh);
    return () => window.removeEventListener(LOCK_EVENT, refresh);
  }, [refresh]);

  const reset = () => {
    setMode('idle');
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const digits = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setter(e.target.value.replace(/\D/g, '').slice(0, PIN_MAX));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (mode !== 'enable') {
      setBusy(true);
      const ok = await verifyPin(current);
      setBusy(false);
      if (!ok) return setError('현재 비밀번호가 맞지 않아요.');
    }
    if (mode === 'disable') {
      disableLock();
      reset();
      return toast('앱 잠금을 껐어요.');
    }
    if (!isValidPin(next)) return setError(`숫자 ${PIN_MIN}~${PIN_MAX}자리로 정해 주세요.`);
    if (next !== confirm) return setError('두 비밀번호가 서로 달라요.');

    setBusy(true);
    await setPin(next);
    setBusy(false);
    reset();
    toast(mode === 'enable' ? '앱 잠금을 켰어요.' : '잠금 비밀번호를 바꿨어요.');
  };

  const toggleBiometric = async () => {
    if (bioOn) {
      disableBiometric();
      return toast('지문·얼굴 인식을 껐어요.');
    }
    setBusy(true);
    const ok = await enableBiometric();
    setBusy(false);
    toast(ok ? '지문·얼굴 인식을 켰어요.' : '지문·얼굴 인식을 등록하지 못했어요.', ok ? 'success' : 'error');
  };

  if (!ready) return <div className="h-16 animate-pulse rounded-xl bg-slate-200/70" role="status" aria-label="불러오는 중" />;

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-500">
        일기를 다른 사람이 보지 못하게, 앱을 열 때 비밀번호를 먼저 물어요. 이 기기에만 적용되고, 기록 자체는 로그인으로 보호돼요.
      </p>

      {enabled ? (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          <strong className="font-semibold">앱 잠금을 사용 중이에요.</strong>
          <span className="text-xs text-slate-500">열 때, 그리고 1분 넘게 떠났다 돌아오면 잠겨요.</span>
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          앱 잠금을 쓰지 않고 있어요.
        </p>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {!enabled && (
            <button type="button" onClick={() => setMode('enable')} className={btnPrimary}>
              <LockKeyhole className="h-4 w-4" aria-hidden /> 앱 잠금 켜기
            </button>
          )}
          {enabled && (
            <>
              <button type="button" onClick={() => window.dispatchEvent(new Event(LOCK_NOW_EVENT))} className={btnPrimary}>
                <LockKeyhole className="h-4 w-4" aria-hidden /> 지금 잠그기
              </button>
              {bioSupported && (
                <button type="button" onClick={toggleBiometric} disabled={busy} className={btnGhost} aria-pressed={bioOn}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Fingerprint className="h-4 w-4" aria-hidden />}
                  {bioOn ? '지문·얼굴 인식 끄기' : '지문·얼굴 인식 사용'}
                </button>
              )}
              <button type="button" onClick={() => setMode('change')} className={btnGhost}>
                비밀번호 변경
              </button>
              <button type="button" onClick={() => setMode('disable')} className={btnGhost}>
                잠금 끄기
              </button>
            </>
          )}
        </div>
      )}

      {mode !== 'idle' && (
        <form onSubmit={submit} className="space-y-3">
          {mode !== 'enable' && (
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              aria-label="현재 잠금 비밀번호"
              value={current}
              onChange={digits(setCurrent)}
              placeholder="현재 비밀번호"
              className={inputClass}
            />
          )}
          {mode !== 'disable' && (
            <>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                aria-label="새 잠금 비밀번호"
                value={next}
                onChange={digits(setNext)}
                placeholder={`새 비밀번호 (숫자 ${PIN_MIN}~${PIN_MAX}자리)`}
                className={inputClass}
              />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                aria-label="새 잠금 비밀번호 확인"
                value={confirm}
                onChange={digits(setConfirm)}
                placeholder="새 비밀번호 확인"
                className={inputClass}
              />
            </>
          )}
          {error && (
            <p role="alert" className="text-xs text-rose-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {mode === 'enable' ? '잠금 켜기' : mode === 'change' ? '비밀번호 변경' : '잠금 끄기'}
            </button>
            <button type="button" onClick={reset} className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
              취소
            </button>
          </div>
        </form>
      )}

      {bioSupported ? null : (
        <p className="text-xs text-slate-500">이 기기나 브라우저에서는 지문·얼굴 인식을 쓸 수 없어요. 숫자 비밀번호로만 잠가요.</p>
      )}
    </div>
  );
}
