import { fnv1a } from '@/lib/utils/hashSeed';
import { TAROT_CARDS, type TarotCard } from './cards';

/** 결정론적 난수 (mulberry32): 같은 시드면 항상 같은 순서 */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 오늘 펼쳐 놓을 카드 count 장. 같은 사용자·같은 날이면 기기와 상관없이 같은 순서로 펼쳐지고, 자정에 새로 섞인다. */
export function dealSpread(userId: string, dateStr: string, count = TAROT_CARDS.length): TarotCard[] {
  const random = seededRandom(fnv1a(`tarot:${userId}:${dateStr}`));
  const deck = [...TAROT_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}
