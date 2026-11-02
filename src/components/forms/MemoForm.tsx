'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Loader2, Pin, Tag, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MAX_PINNED } from '@/hooks/usePinnedIdeas';
import { useToast } from '@/components/ui/Toast';
import { cn, todayISO } from '@/lib/utils';

interface MemoFormProps {
  userId: string;
  defaultDate?: string;
  onSuccess?: () => void;
}

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;

/** 생각/아이디어 퀵 메모: 본문만 필수. 제목을 비우면 첫 줄이 제목이 된다. */
export default function MemoForm({ userId, defaultDate, onSuccess }: MemoFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [targetDate, setTargetDate] = useState(defaultDate || todayISO());
  const [memoTitle, setMemoTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const contentInvalid = submitted && !content.trim();

  /** 태그 하나를 추가한다. '#' 와 공백은 걷어내고, 중복·개수 초과는 무시한다. */
  const commitTag = (raw: string, current: string[]): string[] => {
    const clean = raw.trim().replace(/^#+/, '').replace(/\s+/g, '').slice(0, MAX_TAG_LENGTH);
    if (!clean) return current;
    if (current.some((t) => t.toLowerCase() === clean.toLowerCase())) return current;
    if (current.length >= MAX_TAGS) {
      toast(`태그는 최대 ${MAX_TAGS}개까지 달 수 있어요.`, 'warning');
      return current;
    }
    return [...current, clean];
  };

  const handleTagChange = (value: string) => {
    // 붙여넣기 등으로 쉼표가 들어오면 그 앞부분은 태그로 확정한다
    if (value.includes(',')) {
      const parts = value.split(',');
      let next = tags;
      for (const part of parts.slice(0, -1)) next = commitTag(part, next);
      setTags(next);
      setTagInput(parts[parts.length - 1]);
      return;
    }
    setTagInput(value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중 Enter 는 글자 확정용
    if (e.key === 'Enter') {
      e.preventDefault();
      setTags(commitTag(tagInput, tags));
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);
    const body = content.trim();
    if (!body) return;

    setIsSubmitting(true);
    const supabase = createClient();

    // 입력창에 남아 있는 태그도 저장에 포함한다
    const finalTags = commitTag(tagInput, tags);
    const autoTitle = body.split('\n')[0].trim().slice(0, 40);

    if (isPinned) {
      const { count } = await supabase
        .from('records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'MEMO')
        .eq('is_pinned', true);
      if ((count ?? 0) >= MAX_PINNED) {
        toast(`고정은 최대 ${MAX_PINNED}개까지예요. 고정을 끄고 저장하거나, 다른 아이디어의 고정을 먼저 풀어 주세요.`, 'warning');
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('records').insert({
      user_id: userId,
      type: 'MEMO',
      target_date: targetDate,
      memo_title: memoTitle.trim() || autoTitle,
      content: body,
      image_urls: [],
      is_pinned: isPinned,
      tags: finalTags,
    });

    if (error) {
      toast(`메모 저장에 실패했습니다: ${error.message}`, 'error');
      setIsSubmitting(false); // 실패 시에만 재시도 허용 (성공 후 이동 중 중복 INSERT 차단)
      return;
    }
    toast('메모를 저장했어요.');
    if (onSuccess) onSuccess();
    else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="memo-date" className="sr-only">
          날짜
        </label>
        <input
          id="memo-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="rounded-lg border border-slate-200 p-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
        />
        <button
          type="button"
          aria-pressed={isPinned}
          onClick={() => setIsPinned(!isPinned)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
            isPinned
              ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600',
          )}
        >
          <Pin className={cn('h-3.5 w-3.5', isPinned && 'fill-fuchsia-600 text-fuchsia-600')} aria-hidden />
          {isPinned ? '대시보드 상단에 고정' : '중요 아이디어 고정'}
        </button>
      </div>

      <div>
        <label htmlFor="memo-title" className="mb-1 block text-xs font-semibold text-slate-500">
          제목 (선택)
        </label>
        <div className="relative">
          <Lightbulb className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fuchsia-500" aria-hidden />
          <input
            id="memo-title"
            type="text"
            maxLength={80}
            placeholder="비우면 본문 첫 줄이 제목이 돼요"
            value={memoTitle}
            onChange={(e) => setMemoTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="memo-content" className="mb-1 block text-xs font-semibold text-slate-500">
          생각 / 아이디어 *
        </label>
        <textarea
          id="memo-content"
          rows={6}
          placeholder="떠오른 생각, 아이디어, 영감을 바로 적어 두세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={contentInvalid}
          className={cn(
            'w-full rounded-xl border p-3 text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2',
            contentInvalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-fuchsia-500',
          )}
        />
        {contentInvalid && <p className="mt-1 text-xs text-rose-600">내용을 입력해주세요.</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="memo-tag-input" className="block text-xs font-semibold text-slate-500">
          태그 (최대 {MAX_TAGS}개 · 엔터나 쉼표로 추가)
        </label>
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2 focus-within:ring-2 focus-within:ring-fuchsia-500">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-100 bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700"
            >
              #{t}
              <button
                type="button"
                aria-label={`태그 ${t} 삭제`}
                onClick={() => setTags(tags.filter((x) => x !== t))}
                className="text-fuchsia-400 hover:text-rose-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {tags.length < MAX_TAGS && (
            <div className="flex min-w-[120px] flex-1 items-center gap-1">
              <Tag className="ml-1 h-3.5 w-3.5 text-slate-400" aria-hidden />
              <input
                id="memo-tag-input"
                type="text"
                placeholder={tags.length === 0 ? '#아이디어  #기획  #영감' : '태그 추가'}
                value={tagInput}
                onChange={(e) => handleTagChange(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) {
                    setTags(commitTag(tagInput, tags));
                    setTagInput('');
                  }
                }}
                className="w-full border-none !bg-transparent p-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-fuchsia-700 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="저장 중" /> : <span>메모 저장</span>}
      </button>
    </form>
  );
}
