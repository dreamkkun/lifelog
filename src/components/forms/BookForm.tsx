'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Quote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { cn, todayISO } from '@/lib/utils';

interface BookFormProps {
  userId: string;
  defaultDate?: string;
  onSuccess?: () => void;
}

const fieldClass = (invalid: boolean) =>
  cn(
    'w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2',
    invalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-500',
  );

export default function BookForm({ userId, defaultDate, onSuccess }: BookFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [targetDate, setTargetDate] = useState(defaultDate || todayISO());
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [quote, setQuote] = useState('');
  const [pageNumber, setPageNumber] = useState<number | ''>('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const titleInvalid = submitted && !bookTitle.trim();
  const quoteInvalid = submitted && !quote.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);
    if (!bookTitle.trim() || !quote.trim()) return;

    setIsSubmitting(true);
    const { error } = await createClient()
      .from('records')
      .insert({
        user_id: userId,
        type: 'BOOK',
        target_date: targetDate,
        book_title: bookTitle.trim(),
        book_author: bookAuthor.trim() || null,
        quote: quote.trim(),
        page_number: pageNumber === '' ? null : pageNumber,
        // content 는 NOT NULL 이므로 감상이 없으면 발췌문으로 대체
        content: content.trim() || quote.trim(),
        image_urls: [],
      });

    if (error) {
      toast(`독서 기록 저장에 실패했습니다: ${error.message}`, 'error');
      setIsSubmitting(false);
      return;
    }
    toast('독서 노트를 저장했어요.');
    if (onSuccess) onSuccess();
    else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full space-y-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="book-target-date" className="mb-1 block text-xs font-semibold text-slate-500">
            날짜
          </label>
          <input
            id="book-target-date"
            type="date"
            required
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="book-title" className="mb-1 block text-xs font-semibold text-slate-500">
            도서명 *
          </label>
          <input
            id="book-title"
            type="text"
            placeholder="책 제목 입력"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            aria-invalid={titleInvalid}
            className={fieldClass(titleInvalid)}
          />
          {titleInvalid && <p className="mt-1 text-xs text-rose-600">도서명을 입력해주세요.</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="book-author" className="mb-1 block text-xs font-semibold text-slate-500">
            저자
          </label>
          <input
            id="book-author"
            type="text"
            placeholder="저자명 입력"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
        <div>
          <label htmlFor="book-page" className="mb-1 block text-xs font-semibold text-slate-500">
            페이지 (선택)
          </label>
          <input
            id="book-page"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="p. 142"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className={fieldClass(false)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="book-quote" className="mb-1 block text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Quote className="h-3.5 w-3.5 text-indigo-500" aria-hidden /> 기억에 남는 문장 / 발췌구 *
          </span>
        </label>
        <textarea
          id="book-quote"
          rows={4}
          placeholder="기억하고 싶은 구절이나 인상적인 문장을 적어주세요."
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          aria-invalid={quoteInvalid}
          className={cn(fieldClass(quoteInvalid), 'bg-indigo-50/20 font-serif italic')}
        />
        {quoteInvalid && <p className="mt-1 text-xs text-rose-600">발췌문을 입력해주세요.</p>}
      </div>

      <div>
        <label htmlFor="book-reflection" className="mb-1 block text-xs font-semibold text-slate-500">
          나의 생각 / 감상 (선택)
        </label>
        <textarea
          id="book-reflection"
          rows={4}
          placeholder="이 문장을 읽고 든 생각이나 나만의 해석을 덧붙여 보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="저장 중" /> : <span>독서 노트 저장</span>}
      </button>
    </form>
  );
}
