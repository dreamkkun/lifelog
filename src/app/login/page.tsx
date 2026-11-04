'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { KeyRound, Mail } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button, inputClass } from '@/components/ui/Field';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 이번 주(일~토) 띠: 이 앱이 날짜 중심이라는 걸 로그인 전에 보여준다. 날짜는 브라우저에서 계산한다. */
function WeekStrip() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const days = WEEKDAYS.map((label, i) => {
    if (!today) return { label, n: null as number | null, isToday: false };
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return { label, n: d.getDate(), isToday: i === today.getDay() };
  });

  return (
    <div aria-hidden className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
      {days.map((x) => (
        <div
          key={x.label}
          className={`flex h-14 flex-col items-center justify-center gap-1 ${x.isToday ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
        >
          <span className={`text-xs ${x.isToday ? 'text-slate-300' : 'text-slate-500'}`}>{x.label}</span>
          <span className="text-sm font-semibold tabular-nums">{x.n ?? ' '}</span>
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
      <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-500">
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

type Mode = 'link' | 'password';
const MODE_KEY = 'lifelog:login-mode';

function LoginForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error')
      ? '링크가 만료됐거나, 링크를 요청한 곳과 다른 브라우저·앱에서 열렸어요. 새 링크를 받은 뒤 같은 브라우저에서 열거나, 비밀번호로 로그인해 보세요.'
      : null,
  );

  // 마지막으로 쓴 방식을 기억한다 (비밀번호를 쓰는 사람은 다음부터 바로 비밀번호 칸이 보인다)
  useEffect(() => {
    try {
      if (localStorage.getItem(MODE_KEY) === 'password') setMode('password');
    } catch {
      // 저장소를 못 쓰는 환경에서는 기본값 유지
    }
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  const changeMode = (m: Mode) => {
    setMode(m);
    setSent(false);
    setError(null);
  };

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

  // 비밀번호 로그인: 메일 링크를 거치지 않아 폰·설치형 앱에서도 같은 화면에서 끝난다.
  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setError('이메일 또는 비밀번호가 맞지 않아요. 비밀번호를 아직 만들지 않았다면 "이메일 링크"로 로그인한 뒤 설정에서 만들 수 있어요.');
      return;
    }
    try {
      localStorage.setItem(MODE_KEY, 'password');
    } catch {
      // 무시
    }
    window.location.assign('/'); // 세션 쿠키가 생긴 상태로 미들웨어를 다시 거치게 한다
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
      <div className="space-y-4">
        <div role="status" className="space-y-3 border-l-2 border-emerald-500 pl-4">
          <h2 className="font-serif text-lg font-semibold text-slate-900">메일함을 확인해 주세요</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-800">{email}</strong>로 로그인 링크를 보냈어요. 메일의 링크를 누르면 바로 들어와요.
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            링크는 로그인을 요청한 같은 브라우저에서 열어야 해요. 메일 앱 안에서 열리는 화면에서는 실패할 수 있어요.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
          <button type="button" onClick={() => setSent(false)} className="underline underline-offset-2 hover:text-slate-900">
            다른 주소로 다시 받기
          </button>
          <button type="button" onClick={() => changeMode('password')} className="underline underline-offset-2 hover:text-slate-900">
            비밀번호로 로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="로그인 방법" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        {(
          [
            { m: 'link', label: '이메일 링크', Icon: Mail },
            { m: 'password', label: '비밀번호', Icon: KeyRound },
          ] as const
        ).map(({ m, label, Icon }) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => changeMode(m)}
            className={`flex items-center justify-center gap-1.5 min-h-11 rounded-lg py-2 transition-all ${
              mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === 'link' ? (
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
      ) : (
        <form onSubmit={signInWithPassword} className="space-y-3">
          <label htmlFor="login-email-pw" className="sr-only">
            이메일 주소
          </label>
          <input
            id="login-email-pw"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className={inputClass}
          />
          <label htmlFor="login-password" className="sr-only">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className={inputClass}
          />
          <Button type="submit" loading={loading} disabled={!email.trim() || !password} className="w-full">
            <KeyRound className="h-4 w-4" aria-hidden /> 로그인
          </Button>
          <p className="text-xs leading-relaxed text-slate-500">
            비밀번호는 &ldquo;이메일 링크&rdquo;로 로그인한 뒤 설정 화면에서 만들 수 있어요.
          </p>
        </form>
      )}

      {GOOGLE_ENABLED && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" /> 또는 <span className="h-px flex-1 bg-slate-200" />
          </div>
          <Button type="button" variant="ghost" onClick={google} className="w-full">
            Google로 계속하기
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm leading-relaxed text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    // 소개는 위, 로그인 칸은 아래(엄지가 닿는 곳)에 둔다. 하단 탭바·홈 인디케이터 여백은 layout 이 이미 잡는다.
    <main className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-sm flex-col justify-between gap-10 p-6 pt-16">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-slate-900">LifeLog</h1>
          <p className="text-sm text-slate-500">일기, 독서, 강의를 한곳에 모아 두세요</p>
        </div>
        <WeekStrip />
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
