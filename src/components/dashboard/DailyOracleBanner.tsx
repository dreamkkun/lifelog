'use client';

import React from 'react';
import { Compass, Lightbulb } from 'lucide-react';
import { usePersonalizedInsight } from '@/hooks/usePersonalizedInsight';
import { STAR_SIGN_EMOJI_MAP, ZODIAC_EMOJI_MAP } from '@/lib/utils/zodiacCalculator';
import type { UserProfile } from '@/types/routine.types';

interface DailyOracleBannerProps {
  profile: UserProfile | null;
  onOpenProfileSetup: () => void;
}

/** 오늘의 한마디: 같은 날·같은 프로필이면 하루 종일 같은 글귀, 자정에 다음 글귀로 바뀐다 */
export default function DailyOracleBanner({ profile, onOpenProfileSetup }: DailyOracleBannerProps) {
  const { insight } = usePersonalizedInsight(profile);

  return (
    <section
      aria-label="오늘의 한마디"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white shadow-sm sm:p-6"
    >
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="whitespace-nowrap text-sm font-semibold text-indigo-200">오늘의 한마디</h2>
          {profile && (
            <button
              type="button"
              onClick={onOpenProfileSetup}
              aria-label="성향 프로필 수정"
              className="flex flex-wrap justify-end gap-1.5 text-xs font-medium"
            >
              <span className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20">{profile.mbti}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20">
                {profile.zodiac_animal}띠 {ZODIAC_EMOJI_MAP[profile.zodiac_animal]}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20">
                {profile.star_sign} {STAR_SIGN_EMOJI_MAP[profile.star_sign]}
              </span>
            </button>
          )}
        </div>

        <blockquote className="font-serif text-lg leading-relaxed text-white sm:text-xl">
          &ldquo;{insight.quote}&rdquo;
          <footer className="mt-1.5 font-sans text-xs text-indigo-200">{insight.author}</footer>
        </blockquote>

        <p className="flex gap-2 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-slate-200">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" aria-hidden />
          <span>
            <strong className="font-semibold text-indigo-100">오늘의 행동 가이드</strong> {insight.actionAdvice}
          </span>
        </p>

        {!profile && (
          <button
            type="button"
            onClick={onOpenProfileSetup}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-indigo-50"
          >
            <Compass className="h-4 w-4" aria-hidden /> 30초 만에 성향 등록하고 매일 맞춤 명언 받기
          </button>
        )}
      </div>
    </section>
  );
}
