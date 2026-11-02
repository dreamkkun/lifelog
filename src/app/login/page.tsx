'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button, inputClass } from '@/components/ui/Field';

/** 일주일 샘플: 이 앱이 어떻게 기록을 보여주는지 로그인 전에 미리 알려준다 */
function WeekStrip() {
  const days = [
    { d: '월', n: 12, dots: ['bg-emerald-500'] },
    { d: '화', n: 13, dots: [] },
    { d: '수', n: 14, dots: ['bg-emerald-500', 'bg-amber-500'] },
    { d: '목', n: 15, dots: ['bg-indigo-500'] },
    { d: '금', n: 16, dots: ['bg-emerald-500'] },
    { d: '토', n: 17, dots: [] },
    { d: '일', n: 18, dots: ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500'] },
  ];
  return (
    <div aria-hidden className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
      {days.map((x) => (
        <div key={x.n} className="flex h-16 flex-col items-center justify-between bg-white py-2">
          <span className="text-[10px] text-slate-400">{x.d}</span>
          <span className="text-sm font-semibold tabular-nums text-slate-700">{x.n}</span>
          <span className="flex h-1.5 gap-0.5">
            {x.dots.map((c) => (
              <span key={c} className={`h-1.5 w-1.5 rounded-full ${c}`} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function SetupNotice() {
  return (
    <section aria-labelledby="setup-title" className="space-y-4 border-l-2 border-amber-500 pl-4">
      <h2 id="setup-title" className="font-serif text-lg font-semibold text-slate-900">
        Supabase 연결이 필요해요
      </h2>
      <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-400">
        <li className="space-y-2">
          <p>
            프로젝트 폴더에 <code className="font-mono text-[13px] text-slate-800">.env.local</code> 파일을 만들고 두 값을 채우세요.
          </p>
          <pre className="whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
            {`NEXT_PUBLIC_SUPABASE_URL=https://내프로젝트.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=anon 키`}
          </pre>
        </li>
        <li>
          Supabase의 SQL Editor에서 <code className="font-mono text-[13px] text-slate-800">supabase/schema.sql</code>을 실행하세요.
        </li>
        <li>개발 서버를 껐다가 다시 켜세요.</li>
      </ol>
    </section>
  );
}

// Supabase 에서 Google 공급자를 켠 뒤에만 NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true 로 버튼을 노출한다.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === 'true';

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') ? '로그인하지 못했어요. 메일의 링크를 다시 눌러 보거나 새 링크를 받아 주세요.' : null,
  );

  if (!isSupabaseConfigured) return <SetupNotice />;

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const google = async () => {
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  };

  if (sent) {
    return (
      <div role="status" className="space-y-3 border-l-2 border-emerald-500 pl-4">
        <h2 className="font-serif text-lg font-semibold text-slate-900">메일함을 확인해 주세요</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          <strong className="font-semibold text-slate-800">{email}</strong>로 로그인 링크를 보냈어요. 메일의 링크를 누르면 바로 들어와요.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-900"
        >
          다른 주소로 다시 받기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={sendMagicLink} className="space-y-3">
        <label htmlFor="login-email" className="sr-only">
          이메일 주소
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className={inputClass}
        />
        <Button type="submit" loading={loading} className="w-full">
          <Mail className="h-4 w-4" aria-hidden /> 로그인 링크 받기
        </Button>
      </form>
      {GOOGLE_ENABLED && (
        <>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> 또는 <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button type="button" variant="ghost" onClick={google} className="w-full">
          Google로 계속하기
        </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-sm flex-col justify-center gap-8 p-6">
      <div className="space-y-2">
        <h1 className="font-serif text-5xl font-semibold tracking-tight text-slate-900">LifeLog</h1>
        <p className="text-sm text-slate-500">일기, 독서, 강의를 한곳에 모아 두세요</p>
      </div>
      <WeekStrip />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
