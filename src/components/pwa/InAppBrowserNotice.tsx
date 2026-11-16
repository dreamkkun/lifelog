'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { isCoolingDown, isStandaloneMode, startCooldown, wasClosedThisSession, markClosedThisSession } from '@/lib/pwa';
import { useToast } from '@/components/ui/Toast';

const KEY = 'pwa_inapp_notice_dismissed';
// 카카오톡·네이버·인스타그램 같은 앱 안의 브라우저는 홈 화면 설치를 지원하지 않는다
const IN_APP = /kakaotalk|naver\(inapp|naver|instagram|fban|fbav|line\/|daumapps|twitter/;

type Kind = 'kakao' | 'android' | 'ios';

/** 링크를 카카오톡 등 앱 안 브라우저로 열었을 때, 설치가 가능한 브라우저로 옮기도록 안내한다. */
export default function InAppBrowserNotice() {
  const toast = useToast();
  const [kind, setKind] = useState<Kind | null>(null);

  useEffect(() => {
    if (isStandaloneMode()) return;
    const ua = window.navigator.userAgent.toLowerCase();
    if (!IN_APP.test(ua)) return;
    if (isCoolingDown(KEY) || wasClosedThisSession(KEY)) return;
    const next: Kind = /kakaotalk/.test(ua) ? 'kakao' : /android/.test(ua) ? 'android' : 'ios';
    const timer = setTimeout(() => setKind(next), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!kind) return null;

  const close = (persistent: boolean) => {
    setKind(null);
    if (persistent) startCooldown(KEY);
    else markClosedThisSession(KEY);
  };

  const openExternal = () => {
    const url = window.location.href;
    if (kind === 'kakao') {
      // 카카오톡이 기본 브라우저(Chrome/Safari)로 열어 준다
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    } else if (kind === 'android') {
      const { host, pathname, search } = window.location;
      window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast('주소를 복사했어요. Safari에 붙여 넣어 열어 주세요.');
    } catch {
      toast('주소를 복사하지 못했어요. 주소창의 주소를 직접 복사해 주세요.', 'warning');
    }
  };

  return (
    <aside
      role="dialog"
      aria-labelledby="inapp-title"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[57] mx-auto max-w-sm rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.18)] md:bottom-5"
    >
      <button
        type="button"
        onClick={() => close(false)}
        aria-label="안내 닫기"
        className="absolute right-1.5 top-1.5 rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 id="inapp-title" className="pr-8 text-sm font-bold text-slate-900">
        앱으로 설치하려면 브라우저에서 열어 주세요
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        지금은 다른 앱 안에서 열려 있어서 홈 화면에 설치할 수 없어요.{' '}
        {kind === 'ios' ? 'Safari에서 열면 설치 방법이 안내돼요.' : 'Chrome 같은 브라우저에서 열면 설치 안내가 나와요.'}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => close(true)}
          className="min-h-11 flex-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          7일 동안 보지 않기
        </button>
        {kind === 'ios' ? (
          <button
            type="button"
            onClick={copy}
            className="flex min-h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> 주소 복사
          </button>
        ) : (
          <button
            type="button"
            onClick={openExternal}
            className="flex min-h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> 브라우저로 열기
          </button>
        )}
      </div>
    </aside>
  );
}
