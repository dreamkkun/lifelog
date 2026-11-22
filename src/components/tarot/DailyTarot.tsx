'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, MoonStar, PenLine, Sparkles } from 'lucide-react';
import { EVENING_START_HOUR, useTodayTarot } from '@/hooks/useTodayTarot';
import { moodLabel, type MoodId } from '@/lib/tarot/cards';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import TarotArt, { TarotBack } from './TarotArt';

const MAX_ANSWER = 120;

/**
 * 오늘의 타로 한 장. 아침: 카드 → 상징 의미 → 오늘의 질문 → 한 줄 답(오늘 일기 첫 줄로 저장).
 * 저녁(18시 이후): "오늘 아침 카드는 ○○였어요. 하루 어땠나요?" → 기분 + 한 줄 회고, 아침 질문과 나란히 보여준다.
 */
export default function DailyTarot({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { card, spread, day, loading, error, reveal, saveMorning, saveEvening, moods } = useTodayTarot(userId);

  const [revealing, setRevealing] = useState(false);
  const [picked, setPicked] = useState<number | null>(null); // 펼쳐 놓은 카드 중 고른 한 장
  const scroller = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState('');
  const [mood, setMood] = useState<MoodId | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [eveningOpen, setEveningOpen] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const t = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" role="status" aria-label="오늘의 타로 불러오는 중" />;
  }

  const drawn = !!day;
  const answered = !!day?.morning_answer;
  const reflected = !!day?.mood;
  const isEvening = hour >= EVENING_START_HOUR;
  const showEveningForm = drawn && !reflected && (isEvening || eveningOpen);

  /** 고른 카드를 확정하면 뒤집히며 오늘의 카드가 정해진다. */
  const confirmPick = async () => {
    if (revealing || picked === null) return;
    setRevealing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 400)); // 고른 카드가 뒤집히는 시간
    await reveal(spread[picked].id);
    setRevealing(false);
  };

  const slide = (dir: -1 | 1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const submitMorning = async (goWrite: boolean) => {
    const text = answer.trim();
    if (!text || busy) return;
    setBusy(true);
    setFormError(null);
    const res = await saveMorning(text);
    setBusy(false);
    if (res.error) return setFormError(res.error);
    setAnswer('');
    toast('답을 오늘 일기의 첫 줄에 저장했어요.');
    if (goWrite && res.diaryId) router.push(`/edit/${res.diaryId}`);
  };

  const submitEvening = async () => {
    if (!mood || busy) return;
    setBusy(true);
    setFormError(null);
    const res = await saveEvening(mood, note);
    setBusy(false);
    if (res.error) return setFormError(res.error);
    setNote('');
    setMood(null);
    toast('저녁 회고를 오늘 일기에 이어 적었어요.');
  };

  // 안 뽑는 날도 있으니, 뽑기 전에는 뒷면 카드만 조용히 펼쳐 두고 원할 때만 고르게 한다
  if (!day || !card) {
    return (
      <section aria-label="오늘의 타로" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden /> 오늘의 타로
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          원하는 날에만 뽑아 보세요. 카드 {spread.length}장을 좌우로 넘겨 보며 마음이 끌리는 한 장을 고르고 &lsquo;이 카드로 정하기&rsquo;를 눌러 주세요. 하루에 한 번 정해지고, 안 뽑아도 괜찮아요.
        </p>
        {error && (
          <p role="alert" className="mt-2 text-xs text-rose-600">
            {error}
          </p>
        )}
        <div className="relative mt-3">
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="왼쪽으로 넘기기"
            className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="오른쪽으로 넘기기"
            className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div
            ref={scroller}
            role="group"
            aria-label={`카드 ${spread.length}장 중 하나 고르기`}
            className="flex snap-x snap-mandatory items-end gap-2 overflow-x-auto px-[calc(50%-34px)] pb-3 pt-5 [perspective:800px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {spread.map((_, i) => {
              const isPicked = picked === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !revealing && setPicked(i)}
                  disabled={revealing}
                  aria-pressed={isPicked}
                  aria-label={`${i + 1}번째 카드 ${isPicked ? '선택됨' : '선택'}`}
                  className={cn(
                    'shrink-0 snap-center rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 motion-reduce:transition-none',
                    isPicked ? '-translate-y-3 ring-2 ring-indigo-400' : 'hover:-translate-y-1',
                    revealing && !isPicked && 'scale-95 opacity-30',
                  )}
                >
                  <span
                    className="block"
                    style={{
                      transform: isPicked && revealing ? 'rotateY(90deg)' : 'rotateY(0deg)',
                      transition: 'transform 400ms ease-in',
                    }}
                  >
                    <TarotBack className="w-[68px] drop-shadow-md" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={confirmPick}
          disabled={picked === null || revealing}
          className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-900 disabled:opacity-40"
        >
          {revealing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 카드를 펼치는 중…
            </>
          ) : picked === null ? (
            '카드를 한 장 골라 주세요'
          ) : (
            '이 카드로 정하기'
          )}
        </button>
      </section>
    );
  }

  const inputClass =
    'min-h-11 w-full rounded-xl border border-white/20 !bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-indigo-200/80 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/20';
  const primaryBtn =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-indigo-50 disabled:opacity-40';
  const ghostBtn =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40';

  return (
    <section aria-label="오늘의 타로" className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 p-5 text-white shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-indigo-200">
          <Sparkles className="h-4 w-4" aria-hidden /> 오늘의 타로
        </h2>
        {drawn && (
          <span className="text-xs text-indigo-200">
            {answered ? '아침 질문 완료' : '질문이 기다리고 있어요'}
            {reflected ? ' · 저녁 회고 완료' : ''}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      )}

      {(
        <div className="mt-4 space-y-5">
          <div className="flex gap-4">
            <TarotArt id={card.id} className="w-24 shrink-0 animate-slide-up drop-shadow-lg motion-reduce:animate-none sm:w-28" />
            <div className="min-w-0 space-y-2">
              <div>
                <h3 className="font-serif text-xl font-semibold leading-snug">{card.ko}</h3>
                <p className="text-xs text-indigo-200">{card.en}</p>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {card.keywords.map((k) => (
                  <li key={k} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-indigo-100">
                    {k}
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-indigo-50">{card.meaning}</p>
            </div>
          </div>

          {/* 아침: 오늘의 질문 */}
          <div className="space-y-2 rounded-xl bg-white/5 p-4">
            <p className="text-xs font-semibold text-indigo-200">오늘의 질문</p>
            <p className="font-serif text-base leading-relaxed">{card.question}</p>

            {answered ? (
              <div className="space-y-2 pt-1">
                <p className="whitespace-pre-wrap rounded-lg bg-white/10 px-3 py-2 text-sm leading-relaxed">{day?.morning_answer}</p>
                {day?.diary_id && (
                  <Link href={`/edit/${day.diary_id}`} className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-indigo-100 underline underline-offset-2">
                    <PenLine className="h-3.5 w-3.5" aria-hidden /> 오늘 일기 이어 쓰기
                  </Link>
                )}
              </div>
            ) : (
              <form
                className="space-y-2 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMorning(true);
                }}
              >
                <label htmlFor="tarot-answer" className="sr-only">
                  오늘의 질문에 대한 한 줄 답
                </label>
                <input
                  id="tarot-answer"
                  value={answer}
                  maxLength={MAX_ANSWER}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="한 줄로 답해 보세요"
                  className={inputClass}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={!answer.trim() || busy} className={primaryBtn}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PenLine className="h-4 w-4" aria-hidden />}
                    일기에 쓰고 이어서 쓰기
                  </button>
                  <button type="button" onClick={() => submitMorning(false)} disabled={!answer.trim() || busy} className={ghostBtn}>
                    저장만 하기
                  </button>
                </div>
                <p className="text-xs text-indigo-200">답은 오늘 일기의 첫 줄이 돼요.</p>
              </form>
            )}
          </div>

          {/* 저녁: 아침 카드와 이어지는 회고 */}
          {answered || reflected ? (
            reflected ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-indigo-200">아침 · {card.ko}</p>
                  <p className="text-xs text-indigo-100">{card.question}</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{day?.morning_answer ?? '답을 남기지 않았어요.'}</p>
                </div>
                <div className="space-y-1 rounded-xl bg-white/5 p-4">
                  <p className="flex items-center gap-1 text-xs font-semibold text-indigo-200">
                    <MoonStar className="h-3.5 w-3.5" aria-hidden /> 저녁 · 기분 {moodLabel(day?.mood)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{day?.evening_note ?? '한 줄 회고를 남기지 않았어요.'}</p>
                </div>
              </div>
            ) : null
          ) : null}

          {showEveningForm && (
            <div className="space-y-3 rounded-xl border border-indigo-300/30 bg-indigo-400/10 p-4">
              <p className="flex items-start gap-1.5 text-sm font-semibold leading-relaxed">
                <MoonStar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                오늘 아침 카드는 &lsquo;{card.ko}&rsquo;였어요. 오늘 하루 어땠나요?
              </p>
              <div role="group" aria-label="오늘의 기분" className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mood === m.id}
                    onClick={() => setMood(m.id)}
                    className={cn(
                      'min-h-11 rounded-full border px-3.5 text-xs font-semibold transition-colors',
                      mood === m.id ? 'border-white bg-white text-slate-900' : 'border-white/30 text-white hover:bg-white/10',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <label htmlFor="tarot-note" className="sr-only">
                한 줄 회고
              </label>
              <input
                id="tarot-note"
                value={note}
                maxLength={MAX_ANSWER}
                onChange={(e) => setNote(e.target.value)}
                placeholder="한 줄 회고 (비워 둬도 돼요)"
                className={inputClass}
              />
              <button type="button" onClick={submitEvening} disabled={!mood || busy} className={primaryBtn}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MoonStar className="h-4 w-4" aria-hidden />}
                회고 남기기
              </button>
              <p className="text-xs text-indigo-200">오늘 일기 끝에 이어서 적혀요. 1분이면 돼요.</p>
            </div>
          )}

          {formError && (
            <p role="alert" className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-100">
              {formError}
            </p>
          )}

          {drawn && !reflected && !isEvening && !eveningOpen && (
            <button type="button" onClick={() => setEveningOpen(true)} className="min-h-11 text-xs font-semibold text-indigo-100 underline underline-offset-2">
              저녁 회고는 {EVENING_START_HOUR}시 이후에 알려 드려요 · 지금 남기기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
