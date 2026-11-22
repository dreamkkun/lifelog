// 책 정보 검색(클라이언트 쪽): 표지 OCR 로 읽은 글자나 입력한 제목을 /api/book-search 로 보내 후보를 받는다.
// 실제 외부 검색(Google Books, Open Library)은 서버 라우트가 한다. 한국 책은 총 페이지 수나 분야가 비어 있을 수 있어서,
// 후보를 고른 뒤 직접 고칠 수 있게 한다.

export interface BookCandidate {
  id: string;
  title: string;
  authors: string;
  totalPages: number | null;
  genre: string;
}

// Google Books 의 분야(영어)를 앱에서 쓰는 한국어 분야로 옮긴다. 목록에 없으면 원문 그대로 둔다.
const GENRE_KO: [RegExp, string][] = [
  [/juvenile|young adult|children/i, '어린이/청소년'],
  [/fiction|novel|literary collections|drama/i, '소설/문학'],
  [/poetry/i, '시'],
  [/self-help|personal development/i, '자기계발'],
  [/business|economics|finance|management|marketing/i, '경제/경영'],
  [/psycholog/i, '심리'],
  [/biograph|autobiograph/i, '인물/전기'],
  [/histor/i, '역사'],
  [/philosoph/i, '철학'],
  [/religio|spiritual|bible/i, '종교'],
  [/comput|programming|software/i, '컴퓨터/IT'],
  [/technology|engineering/i, '기술/공학'],
  [/science|nature|mathematic/i, '과학'],
  [/political|law/i, '정치/법'],
  [/social science|sociolog/i, '사회과학'],
  [/health|fitness|medical|body, mind/i, '건강'],
  [/cook|food/i, '요리'],
  [/travel/i, '여행'],
  [/art|design|photograph|music/i, '예술'],
  [/education|study aids/i, '교육'],
  [/family|relationship|parenting/i, '가족/관계'],
  [/essay|humor|literary criticism/i, '에세이'],
];

export function toKoreanGenre(categories: string[] | undefined): string {
  const raw = categories?.[0]?.trim();
  if (!raw) return '';
  return GENRE_KO.find(([re]) => re.test(raw))?.[1] ?? raw;
}

/** 제목(또는 표지에서 읽은 글자)으로 책 후보를 찾는다. */
export async function searchBooks(text: string): Promise<BookCandidate[]> {
  const q = text.replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!q) return [];
  const res = await fetch(`/api/book-search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!res.ok || !isJson) throw new Error('책 정보를 불러오지 못했어요. 로그인 상태와 연결을 확인해 주세요.');
  const json = (await res.json()) as { items?: BookCandidate[] };
  return json.items ?? [];
}

/**
 * 표지 OCR 결과(줄바꿈 유지)에서 검색어를 만든다.
 * 표지는 장식·잡음이 많아서, 글자가 충분한 줄만 모아 앞쪽 몇 줄을 이어 붙인다.
 */
export function coverQuery(rawText: string): { query: string; guessTitle: string } {
  const lines = rawText
    .split('\n')
    // 한글·영문·숫자와 제목에 흔한 부호만 남긴다 (표지 장식이 만드는 잡음 문자는 공백으로)
    .map((l) => l.replace(/[^0-9A-Za-z가-힣\s:'’·&-]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => (l.match(/[0-9A-Za-z가-힣]/g)?.length ?? 0) >= 2);
  const guessTitle = [...lines].sort((a, b) => b.length - a.length)[0] ?? '';
  return { query: lines.slice(0, 4).join(' '), guessTitle };
}

/** 숫자 13자리(978/979 로 시작) 또는 10자리 ISBN 인지 확인한다. */
export function isIsbn(value: string): boolean {
  const v = value.replace(/[-\s]/g, '');
  return /^(97[89]\d{10}|\d{9}[\dXx])$/.test(v);
}

/** ISBN 으로 책 후보를 찾는다. 같은 /api/book-search 에서 isbn: 검색을 한다. */
export function searchByIsbn(isbn: string): Promise<BookCandidate[]> {
  return searchBooks(`isbn:${isbn.replace(/[-\s]/g, '')}`);
}
