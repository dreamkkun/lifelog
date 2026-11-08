'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { inputClass } from '@/components/ui/Field';

export const MAX_NICKNAME = 20;

/** 로그인한 계정에 별명을 붙인다. 계정(user_metadata)에 저장돼 DB 스키마 변경이 필요 없다. */
export default function NicknameForm() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (cancelled || !user) return;
        const current = typeof user.user_metadata?.nickname === 'string' ? user.user_metadata.nickname : '';
        setEmail(user.email ?? '');
        setNickname(current);
        setSaved(current);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = nickname.trim();
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ data: { nickname: next } });
    setBusy(false);
    if (err) {
      setError(`별명을 저장하지 못했어요: ${err.message}`);
      return;
    }
    setNickname(next);
    setSaved(next);
    toast(next ? '별명을 저장했어요.' : '별명을 지웠어요.');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        여러 계정을 쓰거나 폰과 PC를 오가도 지금 어느 계정인지 알아볼 수 있게, 홈 화면에 별명이 보여요.
      </p>
      {email && (
        <p className="text-sm text-slate-600">
          로그인한 계정: <span className="font-medium text-slate-800">{email}</span>
        </p>
      )}
      <label htmlFor="nickname" className="sr-only">
        별명
      </label>
      <input
        id="nickname"
        type="text"
        maxLength={MAX_NICKNAME}
        autoComplete="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder={`별명 (${MAX_NICKNAME}자 이내)`}
        className={inputClass}
      />
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || nickname.trim() === saved}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        별명 저장
      </button>
    </form>
  );
}
