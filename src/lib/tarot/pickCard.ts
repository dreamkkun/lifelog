import { fnv1a } from '@/lib/utils/hashSeed';
import { TAROT_CARDS, type TarotCard } from './cards';

/**
 * 오늘의 카드: 같은 사용자·같은 날짜이면 기기와 상관없이 항상 같은 카드다 (저장 없이 결정된다).
 * 자정에 날짜가 바뀌면 새 카드가 된다. 며칠 연속으로 같은 카드가 나오지 않도록 전날 카드와 겹치면 한 칸 넘긴다.
 */
export function pickDailyCard(userId: string, dateStr: string): TarotCard {
  const index = (date: string) => fnv1a(`tarot:${userId}:${date}`) % TAROT_CARDS.length;
  let i = index(dateStr);

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (m) {
    const prev = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) - 1);
    const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
    if (index(prevStr) === i) i = (i + 1) % TAROT_CARDS.length;
  }
  return TAROT_CARDS[i];
}
