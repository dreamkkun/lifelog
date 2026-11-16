'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MOODS, moodLabel, type MoodId } from '@/lib/tarot/cards';
import { pickDailyCard } from '@/lib/tarot/pickCard';
import { todayISO } from '@/lib/utils';
import type { TarotDay } from '@/types/routine.types';

const MISSING_TABLE_HINT = '타로 기록 테이블이 아직 없어요. Supabase 에서 supabase/schema.sql 을 다시 실행해 주세요.';
const friendly = (message: string) => (/tarot_days|schema cache|does not exist/i.test(message) ? MISSING_TABLE_HINT : message);

export const EVENING_START_HOUR = 18;

/**
 * 오늘의 타로 한 장: 카드는 사용자·날짜로 정해지고, 뽑기(펼치기)·아침 답·저녁 회고는 tarot_days 에 저장된다.
 * 아침 답은 오늘 일기의 첫 줄이 되고, 저녁 회고는 같은 일기 끝에 이어 붙는다.
 */
export function useTodayTarot(userId: string | null) {
  const date = todayISO();
  const card = useMemo(() => (userId ? pickDailyCard(userId, date) : null), [userId, date]);
  const [day, setDay] = useState<TarotDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    createClient()
      .from('tarot_days')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', date)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(friendly(err.message));
        else setDay((data as TarotDay | null) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, date]);

  /** 카드를 펼친다. 저장에 실패해도(테이블이 아직 없는 경우 등) 화면에서는 펼쳐지고, 답을 저장할 때 안내한다. */
  const reveal = useCallback(async () => {
    if (!userId || !card || day) return;
    const { data } = await createClient()
      .from('tarot_days')
      .upsert({ target_date: date, card_id: card.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,target_date' })
      .select()
      .maybeSingle();
    setDay((data as TarotDay | null) ?? ({ card_id: card.id, target_date: date, morning_answer: null, mood: null, evening_note: null, diary_id: null } as TarotDay));
  }, [userId, card, day, date]);

  /** 일기 한 건을 만들거나 이어 붙이고, 그 id 를 돌려준다. */
  const upsertDiary = useCallback(
    async (existingId: string | null, build: (current: string) => string): Promise<{ id: string | null; error: string | null }> => {
      const supabase = createClient();
      if (existingId) {
        const { data: cur } = await supabase.from('records').select('content').eq('id', existingId).maybeSingle();
        if (cur) {
          const content = build((cur as { content: string }).content ?? '');
          const { error: err } = await supabase.from('records').update({ content, updated_at: new Date().toISOString() }).eq('id', existingId);
          return { id: existingId, error: err ? err.message : null };
        }
        // 일기가 지워졌다면 새로 만든다
      }
      const { data, error: err } = await supabase
        .from('records')
        .insert({ type: 'DIARY', target_date: date, content: build(''), image_urls: [] })
        .select('id')
        .single();
      return { id: err ? null : (data as { id: string }).id, error: err ? err.message : null };
    },
    [date],
  );

  const saveDay = useCallback(
    async (patch: Partial<TarotDay>): Promise<string | null> => {
      if (!card) return '카드를 불러오지 못했어요.';
      const { data, error: err } = await createClient()
        .from('tarot_days')
        .upsert({ target_date: date, card_id: card.id, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id,target_date' })
        .select()
        .single();
      if (err) return friendly(err.message);
      setDay(data as TarotDay);
      return null;
    },
    [card, date],
  );

  /** 아침: 질문에 한 줄 답하면 오늘 일기의 첫 줄이 된다. 만든(또는 갱신한) 일기 id 를 돌려준다. */
  const saveMorning = useCallback(
    async (answer: string): Promise<{ diaryId: string | null; error: string | null }> => {
      const text = answer.trim();
      const previous = day?.morning_answer?.trim();
      const diary = await upsertDiary(day?.diary_id ?? null, (current) => {
        if (!current) return text;
        // 이미 한 번 답했다면 첫 줄만 바꾸고 나머지(이어 쓴 글)는 그대로 둔다
        const lines = current.split('\n');
        if (previous && lines[0].trim() === previous) return [text, ...lines.slice(1)].join('\n');
        return `${text}\n\n${current}`;
      });
      if (diary.error) return { diaryId: null, error: `일기에 저장하지 못했어요: ${diary.error}` };
      const err = await saveDay({ morning_answer: text, diary_id: diary.id });
      return { diaryId: diary.id, error: err };
    },
    [day, upsertDiary, saveDay],
  );

  /** 저녁: 기분 + 한 줄 회고. 오늘 일기 끝에 이어 붙인다. */
  const saveEvening = useCallback(
    async (mood: MoodId, note: string): Promise<{ diaryId: string | null; error: string | null }> => {
      const text = note.trim();
      const block = `저녁 회고 (기분: ${moodLabel(mood)})${text ? `\n${text}` : ''}`;
      const diary = await upsertDiary(day?.diary_id ?? null, (current) => (current ? `${current.trimEnd()}\n\n${block}` : block));
      if (diary.error) return { diaryId: null, error: `일기에 저장하지 못했어요: ${diary.error}` };
      const err = await saveDay({ mood, evening_note: text || null, diary_id: diary.id });
      return { diaryId: diary.id, error: err };
    },
    [day, upsertDiary, saveDay],
  );

  return { date, card, day, loading, error, reveal, saveMorning, saveEvening, moods: MOODS };
}
