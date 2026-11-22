'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Camera, ImagePlus, Loader2, Quote, ScanBarcode, Search } from 'lucide-react';
import { saveRecord } from '@/lib/records';
import { useImageOcr } from '@/hooks/useImageOcr';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { coverQuery, searchBooks, searchByIsbn, type BookCandidate } from '@/lib/bookLookup';
import { useToast } from '@/components/ui/Toast';
import { cn, todayISO } from '@/lib/utils';
import type { DatabaseRecord } from '@/types/database.types';

interface BookFormProps {
  userId: string;
  defaultDate?: string;
  onSuccess?: () => void;
  /** 있으면 새 기록이 아니라 이 기록을 수정한다 */
  initialRecord?: DatabaseRecord;
}

const fieldClass = (invalid: boolean) =>
  cn(
    'w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2',
    invalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-indigo-500',
  );

const iconBtn =
  'flex min-h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

const ocrBtn =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50';

export default function BookForm({ userId, defaultDate, onSuccess, initialRecord }: BookFormProps) {
  const isEdit = !!initialRecord;
  const router = useRouter();
  const toast = useToast();

  const [targetDate, setTargetDate] = useState(initialRecord?.target_date ?? (defaultDate || todayISO()));
  const [bookTitle, setBookTitle] = useState(initialRecord?.book_title ?? '');
  const [bookAuthor, setBookAuthor] = useState(initialRecord?.book_author ?? '');
  const [quote, setQuote] = useState(initialRecord?.quote ?? '');
  const [pageNumber, setPageNumber] = useState<number | ''>(initialRecord?.page_number ?? '');
  // 감상을 비워 저장하면 content 에 발췌문이 들어가므로, 수정 화면에서는 발췌문과 같은 내용이면 비워 보여준다
  const [content, setContent] = useState(initialRecord && initialRecord.content !== initialRecord.quote ? initialRecord.content : '');
  const [isSubmitting, setIsSubmittingState] = useState(false);
  // 더블 클릭·느린 네트워크에서 state 갱신 전에 두 번째 제출이 들어오는 것을 동기적으로 막는다
  const submitLock = useRef(false);
  const setIsSubmitting = (v: boolean) => {
    submitLock.current = v;
    setIsSubmittingState(v);
  };
  const [submitted, setSubmitted] = useState(false);

  const { progress, error: ocrError, recognize, isReading } = useImageOcr();
  const cover = useImageOcr();
  const barcode = useBarcodeScan();
  const [totalPages, setTotalPages] = useState<number | ''>(initialRecord?.book_total_pages ?? '');
  const [genre, setGenre] = useState(initialRecord?.book_genre ?? '');
  const [candidates, setCandidates] = useState<BookCandidate[] | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  /** 책 정보 후보를 찾아 보여준다. 못 찾으면 표지에서 읽은 가장 긴 줄을 제목 후보로 넣는다. */
  const findBooks = async (text: string, guessTitle?: string, isbn?: string) => {
    setLookupBusy(true);
    setLookupMsg(null);
    setCandidates(null);
    try {
      const list = isbn ? await searchByIsbn(isbn) : await searchBooks(text);
      if (list.length > 0) setCandidates(list);
      else {
        setLookupMsg('책 정보를 찾지 못했어요. 제목을 확인해서 직접 입력하거나, 제목을 고친 뒤 검색 버튼을 눌러 보세요.');
        if (guessTitle && !bookTitle.trim()) setBookTitle(guessTitle);
      }
    } catch (e) {
      setLookupMsg(e instanceof Error ? e.message : '책 정보를 찾지 못했어요.');
    } finally {
      setLookupBusy(false);
    }
  };

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const raw = await cover.recognize(file, { keepLines: true });
    if (!raw) return;
    const { query, guessTitle } = coverQuery(raw);
    if (!query) return setLookupMsg('표지에서 제목을 읽지 못했어요. 제목이 크게 나오게 다시 찍어 주세요.');
    await findBooks(query, guessTitle);
  };

  const onBarcode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isbn = await barcode.scan(file);
    if (!isbn) return;
    setLookupMsg(null);
    await findBooks('', undefined, isbn);
  };

  const pickBook = (c: BookCandidate) => {
    setBookTitle(c.title);
    if (c.authors) setBookAuthor(c.authors);
    if (c.totalPages) setTotalPages(c.totalPages);
    if (c.genre) setGenre(c.genre);
    setCandidates(null);
    toast('책 정보를 채웠어요. 틀린 부분은 고쳐 주세요.');
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 사진을 다시 골라도 동작하도록
    if (!file) return;
    const text = await recognize(file);
    if (!text) return;
    // 이미 적어 둔 문장이 있으면 지우지 않고 아래에 이어 붙인다
    setQuote((cur) => (cur.trim() ? `${cur.trim()}\n\n${text}` : text));
    toast(`${text.length}자를 읽어 넣었어요. 틀린 글자는 고쳐 주세요.`);
  };

  const titleInvalid = submitted && !bookTitle.trim();
  const quoteInvalid = submitted && !quote.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitLock.current) return;
    setSubmitted(true);
    if (!bookTitle.trim() || !quote.trim()) return;

    setIsSubmitting(true);
    const error = await saveRecord(
      {
        user_id: userId,
        type: 'BOOK',
        target_date: targetDate,
        book_title: bookTitle.trim(),
        book_author: bookAuthor.trim() || null,
        quote: quote.trim(),
        page_number: pageNumber === '' ? null : pageNumber,
        // 총 페이지·분야 열은 schema.sql 을 다시 실행해야 생기므로, 값이 있거나 이미 있는 기록을 수정할 때만 보낸다
        ...(totalPages !== '' || (initialRecord && 'book_total_pages' in initialRecord)
          ? { book_total_pages: totalPages === '' ? null : totalPages }
          : {}),
        ...(genre.trim() || (initialRecord && 'book_genre' in initialRecord) ? { book_genre: genre.trim() || null } : {}),
        // content 는 NOT NULL 이므로 감상이 없으면 발췌문으로 대체
        content: content.trim() || quote.trim(),
        image_urls: initialRecord?.image_urls ?? [],
      },
      initialRecord?.id,
    );

    if (error) {
      toast(`독서 기록 ${isEdit ? '수정' : '저장'}에 실패했습니다: ${error}`, 'error');
      setIsSubmitting(false);
      return;
    }
    toast(isEdit ? '독서 노트를 수정했어요.' : '독서 노트를 저장했어요.');
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
          <div className="flex items-stretch gap-2">
            <input
              id="book-title"
              type="text"
              placeholder="책 제목 입력"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              aria-invalid={titleInvalid}
              className={fieldClass(titleInvalid)}
            />
            <label
              className={iconBtn}
              title="표지를 찍으면 책 정보를 자동으로 채워요"
              aria-label="책 표지 촬영으로 정보 채우기"
            >
              {cover.isReading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
              <input type="file" accept="image/*" capture="environment" disabled={cover.isReading || barcode.isScanning || lookupBusy} className="sr-only" onChange={onCover} />
            </label>
            <label
              className={iconBtn}
              title="책 뒷면 바코드를 찍으면 책 정보를 자동으로 채워요"
              aria-label="바코드 촬영으로 정보 채우기"
            >
              {barcode.isScanning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ScanBarcode className="h-4 w-4" aria-hidden />}
              <input type="file" accept="image/*" capture="environment" disabled={barcode.isScanning || cover.isReading || lookupBusy} className="sr-only" onChange={onBarcode} />
            </label>
            <button
              type="button"
              onClick={() => findBooks(bookTitle)}
              disabled={!bookTitle.trim() || lookupBusy || cover.isReading}
              aria-label="입력한 제목으로 책 정보 찾기"
              title="입력한 제목으로 책 정보 찾기"
              className={iconBtn + ' disabled:cursor-not-allowed disabled:opacity-40'}
            >
              {lookupBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {titleInvalid && <p className="mt-1 text-xs text-rose-600">도서명을 입력해주세요.</p>}
        </div>
      </div>

      {(cover.isReading || barcode.isScanning || lookupBusy || candidates || lookupMsg || cover.error || barcode.error) && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3" aria-live="polite">
          {cover.isReading && (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 표지 글자 읽는 중… {cover.progress > 0 ? `${cover.progress}%` : ''}
            </p>
          )}
          {lookupBusy && (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 책 정보 찾는 중…
            </p>
          )}
          {barcode.isScanning && (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 바코드 읽는 중…
            </p>
          )}
          {barcode.error && <p role="alert" className="text-xs text-rose-600">{barcode.error}</p>}
          {cover.error && <p role="alert" className="text-xs text-rose-600">{cover.error}</p>}
          {lookupMsg && <p role="alert" className="text-xs text-rose-600">{lookupMsg}</p>}
          {candidates && (
            <>
              <p className="text-xs font-semibold text-slate-600">이 책이 맞나요? 골라서 채워 보세요.</p>
              <ul className="space-y-1.5">
                {candidates.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pickBook(c)}
                      className="flex min-h-11 w-full items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-slate-400"
                    >
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-medium text-slate-900">{c.title}</span>
                        <span className="block text-xs text-slate-500">
                          {[c.authors, c.genre, c.totalPages ? `${c.totalPages}쪽` : null].filter(Boolean).join(' · ') || '추가 정보 없음'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setCandidates(null)} className="min-h-11 text-xs font-semibold text-slate-500 underline underline-offset-2">
                맞는 책이 없어요
              </button>
            </>
          )}
        </div>
      )}

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
            발췌 페이지 (선택)
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="book-genre" className="mb-1 block text-xs font-semibold text-slate-500">
            분야 (선택)
          </label>
          <input
            id="book-genre"
            type="text"
            maxLength={30}
            placeholder="소설, 경제/경영 …"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className={fieldClass(false)}
          />
        </div>
        <div>
          <label htmlFor="book-total-pages" className="mb-1 block text-xs font-semibold text-slate-500">
            총 페이지 (선택)
          </label>
          <input
            id="book-total-pages"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="320"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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

        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className={ocrBtn + ' md:hidden'}>
              <Camera className="h-4 w-4" aria-hidden /> 책 사진 찍기
              <input type="file" accept="image/*" capture="environment" disabled={isReading} className="sr-only" onChange={onPhoto} />
            </label>
            <label className={ocrBtn}>
              <ImagePlus className="h-4 w-4" aria-hidden /> 사진에서 가져오기
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={isReading} className="sr-only" onChange={onPhoto} />
            </label>
            {isReading && (
              <span role="status" className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 글자 읽는 중… {progress > 0 ? `${progress}%` : ''}
              </span>
            )}
          </div>
          {ocrError && (
            <p role="alert" className="text-xs text-rose-600">
              {ocrError}
            </p>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            책의 문장이 크게 나오게 찍으면 글자를 읽어 위 칸에 넣어요. 읽은 뒤에 틀린 글자를 고치고, 필요 없는 부분은 지워 주세요. 사진은 저장되지 않아요.
          </p>
        </div>
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
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="저장 중" /> : <span>{isEdit ? '수정 저장' : '독서 노트 저장'}</span>}
      </button>
    </form>
  );
}
