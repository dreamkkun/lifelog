import { NextResponse } from 'next/server';
import { toKoreanGenre, type BookCandidate } from '@/lib/bookLookup';

// 책 정보 검색 서버 라우트. 로그인한 사용자만 쓴다(미들웨어가 막는다).
// 1순위 Google Books, 결과가 없거나 한도(429)에 걸리면 Open Library 로 다시 찾는다.
// 키 없이 쓰는 Google Books 는 하루 한도를 여러 사용자가 나눠 써서 자주 막히므로, 안정적으로 쓰려면
// Vercel 환경 변수 GOOGLE_BOOKS_API_KEY 를 넣는다 (무료).
export const dynamic = 'force-dynamic';

interface GoogleVolume {
  id: string;
  volumeInfo?: { title?: string; authors?: string[]; pageCount?: number; categories?: string[] };
}

async function searchGoogle(q: string, restrictKorean: boolean): Promise<BookCandidate[]> {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '5');
  url.searchParams.set('printType', 'books');
  if (restrictKorean) url.searchParams.set('langRestrict', 'ko');
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set('key', key);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`google ${res.status}`);
  const json = (await res.json()) as { items?: GoogleVolume[] };
  return (json.items ?? [])
    .filter((it) => it.volumeInfo?.title)
    .map((it) => {
      const v = it.volumeInfo!;
      return {
        id: `g:${it.id}`,
        title: v.title ?? '',
        authors: (v.authors ?? []).join(', '),
        totalPages: v.pageCount && v.pageCount > 0 ? v.pageCount : null,
        genre: toKoreanGenre(v.categories),
      };
    });
}

async function searchOpenLibrary(q: string): Promise<BookCandidate[]> {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '5');
  url.searchParams.set('fields', 'key,title,author_name,number_of_pages_median,subject');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`openlibrary ${res.status}`);
  const json = (await res.json()) as {
    docs?: { key: string; title?: string; author_name?: string[]; number_of_pages_median?: number; subject?: string[] }[];
  };
  return (json.docs ?? [])
    .filter((d) => d.title)
    .map((d) => ({
      id: `o:${d.key}`,
      title: d.title ?? '',
      authors: (d.author_name ?? []).slice(0, 3).join(', '),
      totalPages: d.number_of_pages_median && d.number_of_pages_median > 0 ? d.number_of_pages_median : null,
      genre: toKoreanGenre(d.subject?.slice(0, 1)),
    }));
}

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!q) return NextResponse.json({ items: [] });

  // 한국어 책을 먼저, 없으면 언어 제한 없이, 그래도 안 되면 다른 서비스로
  const attempts: (() => Promise<BookCandidate[]>)[] = [
    () => searchGoogle(q, true),
    () => searchGoogle(q, false),
    () => searchOpenLibrary(q),
  ];
  let lastError: unknown = null;
  for (const run of attempts) {
    try {
      const items = await run();
      if (items.length > 0) return NextResponse.json({ items });
    } catch (e) {
      lastError = e;
    }
  }
  // 모두 실패(한도 등)이면 오류로, 단지 결과가 없었으면 빈 목록으로 돌려준다
  if (lastError) return NextResponse.json({ items: [], error: 'unavailable' }, { status: 502 });
  return NextResponse.json({ items: [] });
}
