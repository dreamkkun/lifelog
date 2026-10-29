'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import ProfileSetupForm from '@/components/dashboard/ProfileSetupForm';
import type { UserProfile } from '@/types/routine.types';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialProfile?: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
}

/** 성향 프로필 설정 모달. 배경 클릭·Esc 로 닫히고, 열 때마다 폼이 새로 시작된다. */
export default function ProfileSetupModal({ isOpen, onClose, userId, initialProfile, onProfileUpdated }: ProfileSetupModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl motion-reduce:animate-none sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 pr-8">
          <h2 id="profile-modal-title" className="font-serif text-xl font-semibold text-slate-900">
            나의 성향 등록
          </h2>
          <p className="mt-1 text-xs text-slate-500">생년월일과 MBTI로 매일 나에게 맞는 한마디를 골라 드려요.</p>
        </div>
        <ProfileSetupForm
          userId={userId}
          initialProfile={initialProfile}
          onSaved={(p) => {
            onProfileUpdated(p);
            onClose();
          }}
          submitLabel="저장하기"
        />
      </div>
    </div>
  );
}
