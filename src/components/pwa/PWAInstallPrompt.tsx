'use client';

import React from 'react';
import { ChevronDown, PlusSquare, X } from 'lucide-react';
import { useIOSInstallPrompt } from '@/hooks/useIOSInstallPrompt';
import ShareIconGraphic from '@/components/pwa/ShareIconGraphic';

/** iOS Safari 전용 "홈 화면에 추가" 안내 (beforeinstallprompt 미지원) */
export default function PWAInstallPrompt() {
  const { shouldShowPrompt, isIPad, dismissPrompt } = useIOSInstallPrompt();

  if (!shouldShowPrompt) return null;

  return (
    <aside
      role="dialog"
      aria-labelledby="ios-install-title"
      // 모바일에서는 하단 탭바(4.5rem) 위에 띄운다
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[57] mx-auto max-w-sm animate-slide-up rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md motion-reduce:animate-none md:bottom-5"
    >
      <button
        type="button"
        onClick={() => dismissPrompt(false)}
        className="absolute right-1.5 top-1.5 rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="안내 닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192x192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl shadow-sm" />
        <div className="pr-6">
          <h2 id="ios-install-title" className="text-xs font-bold text-slate-900">
            앱으로 더 편리하게 기록하세요
          </h2>
          <p className="text-xs text-slate-500">주소창 없는 전체화면으로 실행됩니다</p>
        </div>
      </div>

      <ol className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700">
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
            1
          </span>
          <span>
            {isIPad ? '사파리 상단 주소창 옆의 ' : '사파리 하단 툴바의 '}
            <ShareIconGraphic className="mx-0.5 inline h-4 w-4 align-text-bottom text-blue-500" /> <strong>공유</strong> 버튼 누르기
          </span>
        </li>
        <li className="flex items-center gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
            2
          </span>
          <span>
            아래로 스크롤해 <PlusSquare className="mx-0.5 inline h-4 w-4 align-text-bottom text-slate-700" aria-hidden />{' '}
            <strong>홈 화면에 추가</strong> 선택
          </span>
        </li>
      </ol>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
        <button type="button" onClick={() => dismissPrompt(true)} className="text-slate-500 transition-colors hover:text-slate-600">
          7일 동안 보지 않기
        </button>
        <button
          type="button"
          onClick={() => dismissPrompt(false)}
          className="font-semibold text-slate-800 transition-colors hover:text-slate-950"
        >
          확인
        </button>
      </div>

      {/* 하단 툴바(공유 버튼)를 가리키는 화살표. iPad 는 툴바가 위에 있어 숨긴다 */}
      {!isIPad && (
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 animate-bounce justify-center motion-reduce:animate-none" aria-hidden>
          <ChevronDown className="h-5 w-5 text-slate-900 drop-shadow-sm" />
        </div>
      )}
    </aside>
  );
}
