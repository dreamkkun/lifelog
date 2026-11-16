// 오늘의 타로: 메이저 아르카나 22장. 상징 풀이와 질문은 이 앱을 위해 새로 쓴 문장이고, 그림은 자체 일러스트(TarotArt)다.
// 점괘가 아니라 하루를 돌아보게 하는 질문 도구라서, 의미는 단정이 아니라 "관점"으로 적는다.

export interface TarotCard {
  id: number;
  ko: string;
  en: string;
  keywords: [string, string, string];
  /** 상징이 뜻하는 바 (두 문장 이내) */
  meaning: string;
  /** 오늘 하루에 던지는 질문. 한 줄로 답할 수 있게 쓴다 */
  question: string;
}

export const TAROT_CARDS: TarotCard[] = [
  {
    id: 0,
    ko: '바보',
    en: 'The Fool',
    keywords: ['시작', '가벼움', '용기'],
    meaning: '벼랑 끝에서도 가볍게 내딛는 첫걸음이에요. 준비가 완벽하지 않아도 시작하는 용기를 말해요.',
    question: '오늘 계산을 접어 두고 한번 해 보고 싶은 일은 무엇인가요?',
  },
  {
    id: 1,
    ko: '마법사',
    en: 'The Magician',
    keywords: ['의지', '집중', '도구'],
    meaning: '이미 손에 쥔 재료로 원하는 것을 만들어 내는 힘이에요. 흩어진 능력을 한 점에 모으는 카드예요.',
    question: '지금 내가 가진 것 중 오늘 쓰지 않고 있는 재능이나 도구는 무엇인가요?',
  },
  {
    id: 2,
    ko: '여사제',
    en: 'The High Priestess',
    keywords: ['직관', '고요', '내면'],
    meaning: '말하지 않은 것 속에 답이 있다는 카드예요. 서두르기보다 조용히 들여다볼 때 보이는 것을 뜻해요.',
    question: '오늘 마음속에서 계속 속삭이지만 모른 척하고 있는 생각은 무엇인가요?',
  },
  {
    id: 3,
    ko: '여황제',
    en: 'The Empress',
    keywords: ['풍요', '돌봄', '성장'],
    meaning: '정성껏 돌본 것이 자라나는 계절이에요. 몸과 마음을 먹이고 가꾸는 일을 상징해요.',
    question: '오늘 나를 가장 잘 돌보는 방법은 무엇일까요?',
  },
  {
    id: 4,
    ko: '황제',
    en: 'The Emperor',
    keywords: ['질서', '책임', '구조'],
    meaning: '단단한 틀이 있어야 안심하고 나아갈 수 있다는 카드예요. 원칙과 책임으로 중심을 잡는 힘이에요.',
    question: '오늘 지킬 한 가지 원칙을 정한다면 무엇인가요?',
  },
  {
    id: 5,
    ko: '교황',
    en: 'The Hierophant',
    keywords: ['배움', '전통', '스승'],
    meaning: '오래 검증된 방식과 가르침에서 얻는 안정이에요. 배우고 전하는 관계를 상징해요.',
    question: '요즘 누구, 또는 무엇에게 배우고 있고 오늘 하나 적용해 본다면 무엇인가요?',
  },
  {
    id: 6,
    ko: '연인',
    en: 'The Lovers',
    keywords: ['선택', '관계', '일치'],
    meaning: '무엇을 고르느냐가 곧 내가 누구인지를 드러내는 카드예요. 마음과 행동이 같은 방향을 볼 때 힘이 생겨요.',
    question: '오늘 내 마음이 진짜로 끌리는 선택은 무엇인가요?',
  },
  {
    id: 7,
    ko: '전차',
    en: 'The Chariot',
    keywords: ['추진', '균형', '승부'],
    meaning: '서로 다른 두 힘을 한 방향으로 모아 앞으로 나아가는 모습이에요. 속도보다 방향을 잡는 일이 중요해요.',
    question: '오늘 서로 부딪치는 두 마음을 한 방향으로 모은다면 어디로 향하나요?',
  },
  {
    id: 8,
    ko: '힘',
    en: 'Strength',
    keywords: ['부드러움', '인내', '자기 다독임'],
    meaning: '거친 것을 누르는 힘이 아니라 다독이는 힘이에요. 두려움도 내 일부로 받아들일 때 길들여져요.',
    question: '오늘 거칠게 몰아붙이지 않고 다독여 주고 싶은 마음은 무엇인가요?',
  },
  {
    id: 9,
    ko: '은둔자',
    en: 'The Hermit',
    keywords: ['성찰', '혼자만의 시간', '등불'],
    meaning: '한 걸음 물러나 혼자 밝히는 작은 등불이에요. 소란에서 떨어질 때 보이는 길을 말해요.',
    question: '오늘 잠시 혼자 있다면 가장 먼저 생각하고 싶은 것은 무엇인가요?',
  },
  {
    id: 10,
    ko: '운명의 수레바퀴',
    en: 'Wheel of Fortune',
    keywords: ['순환', '전환', '흐름'],
    meaning: '오르고 내리는 일이 돌고 도는 큰 흐름이에요. 바꿀 수 없는 것은 두고, 탈 수 있는 흐름을 보라는 뜻이에요.',
    question: '최근 달라지고 있는 흐름 가운데 오늘 올라타 보고 싶은 것은 무엇인가요?',
  },
  {
    id: 11,
    ko: '정의',
    en: 'Justice',
    keywords: ['균형', '공정', '결과'],
    meaning: '한 일은 저울에 올라 제자리를 찾는다는 카드예요. 사실을 있는 그대로 보고 판단하는 태도를 뜻해요.',
    question: '오늘 사실만 놓고 다시 판단해 보고 싶은 일은 무엇인가요?',
  },
  {
    id: 12,
    ko: '매달린 사람',
    en: 'The Hanged One',
    keywords: ['멈춤', '관점 전환', '내려놓기'],
    meaning: '거꾸로 매달려야 비로소 보이는 풍경이에요. 밀어붙이기를 잠시 멈추고 시선을 바꾸라는 카드예요.',
    question: '오늘 다른 각도에서 바라보고 싶은 상황은 무엇인가요?',
  },
  {
    id: 13,
    ko: '변화',
    en: 'Transformation',
    keywords: ['끝맺음', '정리', '새 단계'],
    meaning: '끝나야 다음이 시작된다는 카드예요. 이미 시들어 버린 것을 놓아 줄 때 자리가 생겨요.',
    question: '오늘 정리하고 마무리 짓고 싶은 것은 무엇인가요?',
  },
  {
    id: 14,
    ko: '절제',
    en: 'Temperance',
    keywords: ['조화', '적당함', '리듬'],
    meaning: '두 잔의 물을 섞어 알맞은 맛을 찾는 모습이에요. 극단 사이에서 나만의 속도와 배합을 찾는 일이에요.',
    question: '오늘 너무 많거나 너무 적은 것을 알맞게 맞춘다면 무엇부터인가요?',
  },
  {
    id: 15,
    ko: '속박',
    en: 'The Bonds',
    keywords: ['집착', '습관', '풀려나기'],
    meaning: '사슬이 느슨한데도 스스로 묶여 있는 모습이에요. 나를 붙잡는 습관이나 생각을 알아차리라는 카드예요.',
    question: '오늘 나를 붙잡고 있는 습관이나 생각은 무엇이고, 풀 수 있다면 어떻게요?',
  },
  {
    id: 16,
    ko: '무너지는 탑',
    en: 'The Tower',
    keywords: ['붕괴', '깨달음', '재건'],
    meaning: '잘못 쌓은 토대가 갑자기 무너지는 순간이에요. 아프지만 거짓 위에 선 것을 걷어 내는 계기가 돼요.',
    question: '오늘 사실은 흔들리고 있었던 가정이나 믿음은 무엇인가요?',
  },
  {
    id: 17,
    ko: '별',
    en: 'The Star',
    keywords: ['희망', '회복', '맑음'],
    meaning: '긴 밤 끝에 비로소 올려다본 맑은 별빛이에요. 지친 마음이 천천히 채워지는 회복을 뜻해요.',
    question: '요즘 나를 조금씩 회복시키는 것은 무엇이고, 오늘 어떻게 더 누릴까요?',
  },
  {
    id: 18,
    ko: '달',
    en: 'The Moon',
    keywords: ['불안', '꿈', '모호함'],
    meaning: '달빛 아래서는 그림자가 실제보다 커 보여요. 확실하지 않은 것을 억지로 단정하지 말라는 카드예요.',
    question: '오늘 막연한 불안 속에서 사실과 상상을 나눈다면 각각 무엇인가요?',
  },
  {
    id: 19,
    ko: '태양',
    en: 'The Sun',
    keywords: ['기쁨', '활력', '드러냄'],
    meaning: '숨길 것 없이 환하게 드러나는 기쁨이에요. 단순하고 따뜻한 활력을 상징해요.',
    question: '오늘 나를 가장 환하게 만드는 한 가지는 무엇인가요?',
  },
  {
    id: 20,
    ko: '심판',
    en: 'Judgement',
    keywords: ['부름', '되돌아봄', '다시 일어서기'],
    meaning: '지나온 길을 돌아보고 새로운 부름에 답하는 순간이에요. 과거를 정리하고 다음 단계로 일어서는 카드예요.',
    question: '지나온 일 중 오늘 다시 불러내 매듭짓고 싶은 것은 무엇인가요?',
  },
  {
    id: 21,
    ko: '세계',
    en: 'The World',
    keywords: ['완성', '통합', '다음 순환'],
    meaning: '하나의 고리가 닫히며 이룬 것을 온전히 느끼는 순간이에요. 마무리 뒤에 새로운 순환이 열린다는 뜻도 있어요.',
    question: '최근 해낸 일 중 스스로 충분히 인정해 주지 않은 것은 무엇인가요?',
  },
];

export const MOODS = [
  { id: 'great', label: '아주 좋음', score: 5 },
  { id: 'good', label: '좋음', score: 4 },
  { id: 'okay', label: '보통', score: 3 },
  { id: 'low', label: '조금 지침', score: 2 },
  { id: 'rough', label: '힘듦', score: 1 },
] as const;

export type MoodId = (typeof MOODS)[number]['id'];
export const moodLabel = (id: string | null | undefined) => MOODS.find((m) => m.id === id)?.label ?? '';
