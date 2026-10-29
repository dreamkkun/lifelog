'use client';

import React, { useId, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useProfileMutation } from '@/hooks/useProfileMutation';
import {
  MBTI_LIST,
  STAR_SIGN_EMOJI_MAP,
  ZODIAC_EMOJI_MAP,
  computeFromBirth,
} from '@/lib/utils/zodiacCalculator';
import { cn, todayISO } from '@/lib/utils';
import type { MBTIType, UserProfile } from '@/types/routine.types';

interface ProfileSetupFormProps {
  userId: string;
  initialProfile?: UserProfile | null;
  onSaved: (profile: UserProfile) => void;
  submitLabel?: string;
}

/** 생년월일 → 띠·별자리 자동 계산 + MBTI 16개 선택 → user_profiles upsert */
export default function ProfileSetupForm({ userId, initialProfile, onSaved, submitLabel = '저장하기' }: ProfileSetupFormProps) {
  const birthId = useId();
  const { saveProfile, isSaving } = useProfileMutation();

  const [birthDate, setBirthDate] = useState('');
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [mbti, setMbti] = useState<MBTIType | null>(initialProfile?.mbti ?? null);
  const [error, setError] = useState<string | null>(null);

  // 생년월일·양력/음력이 바뀔 때마다 즉시 재계산
  const computed = useMemo(() => computeFromBirth(birthDate, isLunar, isLeapMonth), [birthDate, isLunar, isLeapMonth]);

  // 생년월일을 새로 넣지 않았다면 저장돼 있던 값을 그대로 쓴다
  const meta = computed.result
    ? { zodiac: computed.result.zodiac, starSign: computed.result.starSign, fromBirth: true }
    : initialProfile
      ? { zodiac: initialProfile.zodiac_animal, starSign: initialProfile.star_sign, fromBirth: false }
      : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!mbti) return setError('MBTI를 선택해 주세요.');
    if (!meta) return setError(computed.error ?? '생년월일을 입력해 주세요.');

    setError(null);
    const profile: UserProfile = { user_id: userId, mbti, zodiac_animal: meta.zodiac, star_sign: meta.starSign };
    const err = await saveProfile(profile);
    if (err) setError(`프로필을 저장하지 못했어요: ${err}`);
    else onSaved(profile);
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor={birthId} className="block text-xs font-semibold text-slate-700">
          생년월일
        </label>
        <div className="grid grid-cols-3 gap-2">
          <input
            id={birthId}
            type="date"
            max={todayISO()}
            min="1900-01-01"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <div role="radiogroup" aria-label="양력 또는 음력" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {[
              { v: false, label: '양력' },
              { v: true, label: '음력' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={isLunar === o.v}
                onClick={() => setIsLunar(o.v)}
                className={cn('rounded-lg transition-all', isLunar === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {isLunar && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            윤달이에요
          </label>
        )}
        <p className="text-[11px] leading-relaxed text-slate-400">
          {isLunar
            ? '음력은 양력으로 바꿔 별자리를 계산하고, 띠는 입력한 음력 연도 기준이에요.'
            : '양력 생일은 입춘(2월 4일경) 이전이면 전년도 띠로 계산해요. 별자리 경계일은 해마다 하루쯤 다를 수 있어요.'}
        </p>
        {computed.error && <p className="text-xs font-medium text-rose-600">{computed.error}</p>}
      </div>

      {meta && (
        <div className="flex items-center justify-around rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm" aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{ZODIAC_EMOJI_MAP[meta.zodiac]}</span>
            <div>
              <span className="block text-[11px] text-slate-500">{meta.fromBirth ? '계산된 띠' : '저장된 띠'}</span>
              <strong className="font-semibold text-slate-900">{meta.zodiac}띠</strong>
            </div>
          </div>
          <span className="h-7 w-px bg-slate-200" aria-hidden />
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{STAR_SIGN_EMOJI_MAP[meta.starSign]}</span>
            <div>
              <span className="block text-[11px] text-slate-500">{meta.fromBirth ? '계산된 별자리' : '저장된 별자리'}</span>
              <strong className="font-semibold text-slate-900">{meta.starSign}</strong>
            </div>
          </div>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="flex w-full items-center justify-between text-xs font-semibold text-slate-700">
          <span>MBTI 유형</span>
          {mbti && <span className="text-indigo-600">선택: {mbti}</span>}
        </legend>
        <div className="grid grid-cols-4 gap-1.5">
          {MBTI_LIST.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mbti === m}
              onClick={() => setMbti(m)}
              className={cn(
                'rounded-xl border py-2 text-xs transition-all',
                mbti === m
                  ? 'border-indigo-600 bg-indigo-600 font-bold text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />}
        {isSaving ? '저장하는 중…' : submitLabel}
      </button>
      <p className="text-center text-[11px] text-slate-400">성향 가이드는 재미로 참고해 주세요.</p>
    </form>
  );
}
