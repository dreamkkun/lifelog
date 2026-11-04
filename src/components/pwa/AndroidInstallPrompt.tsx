'use client';

import React from 'react';
import { Download, Sparkles, X } from 'lucide-react';
import { useAndroidInstallPrompt } from '@/hooks/useAndroidInstallPrompt';

/** Chromium 계열(beforeinstallprompt 지원) 전용 원클릭 설치 모달 */
export default function AndroidInstallPrompt() {
  const { isOpen, triggerInstall, dismissModal } = useAndroidInstallPrompt();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      // 모바일에서는 하단 탭바(4.5rem) 위에 띄운다
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[57] mx-auto max-w-sm animate-slide-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.18)] motion-reduce:animate-none md:bottom-5"
    >
      <button
        type="button"
        onClick={() => dismissModal(false)}
        className="absolute right-1.5 top-1.5 rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192x192.png" alt="" className="h-11 w-11 shrink-0 rounded-2xl shadow-sm" />
        <div className="pr-4">
          <h2 id="install-title" className="text-sm font-bold leading-snug text-slate-900">
            LifeLog 앱 설치하기
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">홈 화면에 설치하고 전체 화면으로 더 빠르게 메모를 남겨보세요.</p>
        </div>
      </div>

      <div className="mt-3.5 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
          <span>브라우저 주소창 없는 전체화면 네이티브 모드</span>
        </div>
        <div className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
          <span>다운로드 용량 부담 없는 초경량 PWA</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => dismissModal(true)}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          나중에 하기
        </button>
        <button
          type="button"
          onClick={triggerInstall}
          className="flex flex-[1.5] items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          <span>앱 설치</span>
        </button>
      </div>
    </div>
  );
}
