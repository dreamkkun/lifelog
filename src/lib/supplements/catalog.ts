// 자주 먹는 영양제의 일반적인 섭취 권장 시점과 효능 요약.
// 제품마다 함량·형태가 달라 라벨의 복용법이 우선이고, 복용 중인 약이나 지병이 있으면 의사·약사와 상의해야 한다.
// 여기 적힌 내용은 일반적인 참고용 정보이며 질병의 진단·치료·예방을 약속하지 않는다.

export type Timing = 'FASTING' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BEDTIME';

export interface TimingInfo {
  label: string;
  /** 알림 기본 시각 (사용자가 바꿀 수 있다) */
  time: string;
}

export const TIMINGS: Record<Timing, TimingInfo> = {
  FASTING: { label: '아침 공복', time: '07:30' },
  BREAKFAST: { label: '아침 식후', time: '08:30' },
  LUNCH: { label: '점심 식후', time: '12:30' },
  DINNER: { label: '저녁 식후', time: '19:00' },
  BEDTIME: { label: '자기 전', time: '22:00' },
};

export interface CatalogItem {
  key: string;
  name: string;
  timing: Timing;
  /** 왜 이 시간인지 한 줄 */
  why: string;
  /** 알려진 효능(일반 정보) */
  benefits: string[];
  /** 함께 먹을 때 주의할 점 */
  caution?: string;
}

export const SUPPLEMENT_CATALOG: CatalogItem[] = [
  {
    key: 'multivitamin',
    name: '종합비타민',
    timing: 'BREAKFAST',
    why: '지용성 비타민이 섞여 있어 식사 후 흡수가 좋고, 빈속에는 속이 불편할 수 있어요.',
    benefits: ['부족하기 쉬운 비타민·미네랄 보충', '식사가 불규칙할 때 영양 균형 보조'],
  },
  {
    key: 'vitamin-c',
    name: '비타민 C',
    timing: 'BREAKFAST',
    why: '수용성이라 아침에 먹기 좋고, 식후에 먹으면 위 자극이 덜해요.',
    benefits: ['항산화 작용', '콜라겐 합성 도움', '철분 흡수 도움'],
    caution: '한 번에 너무 많이 먹으면 속쓰림·설사가 올 수 있어요.',
  },
  {
    key: 'vitamin-d',
    name: '비타민 D',
    timing: 'LUNCH',
    why: '지용성이라 지방이 있는 식사와 함께 먹을 때 흡수가 좋아요. 점심 식사 후가 기억하기 좋아요.',
    benefits: ['칼슘 흡수와 뼈 건강', '근육 기능 유지', '면역 기능 유지 도움'],
    caution: '과량 복용은 해로울 수 있어요. 제품 라벨의 용량을 지켜 주세요.',
  },
  {
    key: 'omega3',
    name: '오메가3',
    timing: 'DINNER',
    why: '지방이 있는 식사 직후에 먹으면 흡수가 좋고, 비릿한 트림도 줄어요.',
    benefits: ['혈중 중성지방 개선 도움', '혈행 개선', '눈 건강 도움'],
    caution: '혈액 응고를 늦추는 약(항응고제)을 복용 중이면 의사·약사와 상의하세요.',
  },
  {
    key: 'magnesium',
    name: '마그네슘',
    timing: 'BEDTIME',
    why: '근육 이완과 신경 안정에 관여해서 저녁이나 자기 전에 많이 먹어요.',
    benefits: ['근육 경련·피로 완화', '신경과 근육 기능 유지', '에너지 대사 도움'],
    caution: '과하면 설사가 날 수 있어요. 신장이 약하다면 먼저 상담하세요.',
  },
  {
    key: 'calcium',
    name: '칼슘',
    timing: 'DINNER',
    why: '식사와 함께 먹으면 흡수가 좋아요. 한 번에 500mg 안팎으로 나눠 먹으면 더 좋아요.',
    benefits: ['뼈와 치아 건강', '신경·근육 기능 유지'],
    caution: '철분과 2시간 정도 간격을 두세요. 서로 흡수를 방해해요.',
  },
  {
    key: 'iron',
    name: '철분',
    timing: 'FASTING',
    why: '공복에 흡수가 가장 좋아요. 속이 쓰리면 식후로 옮기세요.',
    benefits: ['적혈구 생성', '빈혈 예방 도움', '피로감 완화 도움'],
    caution: '커피·차·칼슘과는 2시간 정도 띄워 드세요. 흡수를 방해해요.',
  },
  {
    key: 'zinc',
    name: '아연',
    timing: 'DINNER',
    why: '빈속에는 메스꺼울 수 있어서 식후가 편해요.',
    benefits: ['면역 기능 유지', '피부·상처 회복 도움', '정상적인 세포 분열'],
    caution: '오래 많이 먹으면 구리가 부족해질 수 있어요.',
  },
  {
    key: 'b-complex',
    name: '비타민 B군',
    timing: 'BREAKFAST',
    why: '에너지 대사에 쓰이는 수용성 비타민이라 활동이 많은 낮을 앞두고 먹는 게 좋아요. 저녁에 먹으면 잠이 얕아질 수 있어요.',
    benefits: ['에너지 생성 도움', '피로 완화', '신경 기능 유지'],
  },
  {
    key: 'probiotics',
    name: '유산균(프로바이오틱스)',
    timing: 'FASTING',
    why: '제품마다 다르지만 위산이 적은 공복이나 식사 직후에 먹으라는 제품이 많아요. 라벨을 먼저 확인하세요.',
    benefits: ['장 건강과 배변 활동 도움', '유익균 늘리기'],
  },
  {
    key: 'lutein',
    name: '루테인',
    timing: 'BREAKFAST',
    why: '지용성이라 지방이 있는 식사와 함께 먹을 때 흡수가 좋아요.',
    benefits: ['눈 건강', '황반 색소 밀도 유지 도움'],
  },
  {
    key: 'coq10',
    name: '코엔자임 Q10',
    timing: 'LUNCH',
    why: '지용성이라 식사와 함께 먹어야 흡수가 좋아요. 저녁에 먹으면 잠이 설칠 수 있다는 사람도 있어요.',
    benefits: ['항산화 작용', '에너지 생성 도움'],
    caution: '혈압약·항응고제 복용 중이면 상담하세요.',
  },
  {
    key: 'k2',
    name: '비타민 K2',
    timing: 'LUNCH',
    why: '지용성이라 식사와 함께 먹고, 비타민 D와 같이 먹는 경우가 많아요.',
    benefits: ['칼슘이 뼈에 자리 잡도록 도움', '뼈 건강'],
    caution: '와파린 같은 항응고제 복용 중이면 반드시 상담하세요.',
  },
  {
    key: 'milk-thistle',
    name: '밀크씨슬',
    timing: 'DINNER',
    why: '식후에 먹으면 위가 편하고, 하루 중 꾸준히 먹기 쉬운 시간이에요.',
    benefits: ['간 건강 도움'],
  },
  {
    key: 'red-ginseng',
    name: '홍삼',
    timing: 'FASTING',
    why: '활력을 주는 편이라 아침에 먹고, 늦은 오후·저녁은 잠을 방해할 수 있어 피해요.',
    benefits: ['피로 개선', '면역력 증진 도움', '혈행 개선'],
    caution: '열이 많거나 혈압·당뇨 약을 먹는다면 상담하세요.',
  },
  {
    key: 'collagen',
    name: '콜라겐',
    timing: 'BEDTIME',
    why: '비타민 C와 함께 먹으면 좋고, 자기 전 공복에 먹는 사람이 많아요.',
    benefits: ['피부 보습·탄력 도움', '관절 건강 도움'],
  },
];

export function findCatalog(key: string | null | undefined): CatalogItem | undefined {
  return key ? SUPPLEMENT_CATALOG.find((c) => c.key === key) : undefined;
}

export const SUPPLEMENT_DISCLAIMER =
  '일반적인 참고 정보예요. 제품 라벨의 복용법이 우선이고, 복용 중인 약이 있거나 임신·수유 중이거나 지병이 있다면 의사·약사와 상의하세요.';
