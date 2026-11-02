import { ImageResponse } from 'next/og';

// 카카오톡·메신저 링크 미리보기(썸네일). 기본 폰트에는 한글이 없어 영문과 도형으로만 구성하고,
// 한글 제목·설명은 og:title / og:description 으로 함께 보인다.
export const runtime = 'edge';
export const alt = 'LifeLog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DOTS = ['#10b981', '#6366f1', '#f59e0b', '#d946ef']; // 일기 · 독서 · 강의 · 메모

const WEEK: { d: string; n: number; dots: number[]; today?: boolean }[] = [
  { d: 'S', n: 12, dots: [0] },
  { d: 'M', n: 13, dots: [] },
  { d: 'T', n: 14, dots: [0, 2] },
  { d: 'W', n: 15, dots: [1] },
  { d: 'T', n: 16, dots: [0, 3] },
  { d: 'F', n: 17, dots: [2], today: true },
  { d: 'S', n: 18, dots: [0, 1, 2] },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 88px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 28,
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 56, height: 8, borderRadius: 4, background: '#cbd5e1' }} />
              <div style={{ width: 38, height: 8, borderRadius: 4, background: '#cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {DOTS.slice(0, 3).map((c) => (
                <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 116, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>LifeLog</div>
            <div style={{ display: 'flex', fontSize: 34, color: '#a5b4fc', marginTop: 10 }}>{'Diary · Books · Lectures · Ideas'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 64 }}>
          {WEEK.map((w, i) => (
            <div
              key={i}
              style={{
                width: 142,
                height: 156,
                borderRadius: 26,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: w.today ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: w.today ? '#0f172a' : '#e2e8f0',
              }}
            >
              <div style={{ display: 'flex', fontSize: 26, opacity: 0.7 }}>{w.d}</div>
              <div style={{ display: 'flex', fontSize: 52, fontWeight: 700 }}>{w.n}</div>
              <div style={{ display: 'flex', gap: 8, height: 14 }}>
                {w.dots.map((k) => (
                  <div key={k} style={{ width: 14, height: 14, borderRadius: 7, background: DOTS[k] }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
