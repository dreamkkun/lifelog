import { useId } from 'react';

// 자체 일러스트: 기존 타로 덱의 그림을 쓰지 않고, 각 카드의 상징을 기하 도형으로 새로 그렸다.
// 한 팔레트(남색 바탕 + 금색·크림·청록·장미·보라)로 22장을 통일해 앱의 톤과 맞춘다.
const GOLD = '#f5c26b';
const CREAM = '#f3ead7';
const TEAL = '#5ec2b7';
const ROSE = '#e58c8a';
const VIOLET = '#9b8cf2';
const NAVY = '#161a3a';

const rad = (deg: number) => (deg * Math.PI) / 180;

/** 중심에서 퍼지는 선(광선·바큇살·갈기) */
function Rays({ cx, cy, r1, r2, n, color = GOLD, width = 2, offset = 0 }: {
  cx: number; cy: number; r1: number; r2: number; n: number; color?: string; width?: number; offset?: number;
}) {
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const a = rad(offset + (360 / n) * i);
        return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} />;
      })}
    </g>
  );
}

/** 꼭짓점이 n 개인 별 */
function Star({ cx, cy, outer, inner, n = 5, color = GOLD, rotate = -90 }: {
  cx: number; cy: number; outer: number; inner: number; n?: number; color?: string; rotate?: number;
}) {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = rad(rotate + (180 / n) * i);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={color} />;
}

function Motif({ id }: { id: number }) {
  switch (id) {
    case 0: // 바보: 벼랑 끝으로 내딛는 작은 삼각형
      return (
        <g>
          <circle cx="88" cy="50" r="14" fill={GOLD} />
          <polygon points="12,190 12,128 70,128 78,138 78,190" fill={VIOLET} opacity="0.85" />
          <polygon points="56,128 66,96 76,126" fill={CREAM} />
          <circle cx="66" cy="88" r="6" fill={CREAM} />
          <path d="M82 118 q14 -8 22 4" stroke={CREAM} strokeWidth="2" fill="none" strokeDasharray="3 4" strokeLinecap="round" />
          <circle cx="40" cy="70" r="3" fill={TEAL} />
        </g>
      );
    case 1: // 마법사: 무한 기호와 네 가지 도구
      return (
        <g fill="none">
          <path d="M36 52 c0 -16 24 -16 24 0 s24 16 24 0 s-24 -16 -24 0 s-24 16 -24 0z" stroke={GOLD} strokeWidth="3" />
          <line x1="60" y1="64" x2="60" y2="130" stroke={CREAM} strokeWidth="4" strokeLinecap="round" />
          <line x1="24" y1="140" x2="96" y2="140" stroke={CREAM} strokeWidth="3" />
          <circle cx="34" cy="128" r="6" fill={ROSE} />
          <rect x="47" y="122" width="10" height="10" fill={TEAL} />
          <polygon points="64,132 70,121 76,132" fill={GOLD} />
          <polygon points="82,128 88,120 94,128 88,136" fill={VIOLET} />
        </g>
      );
    case 2: // 여사제: 두 기둥 사이의 초승달
      return (
        <g>
          <rect x="22" y="40" width="16" height="120" fill={CREAM} />
          <rect x="82" y="40" width="16" height="120" fill="#0b0d24" stroke={CREAM} strokeWidth="2" />
          <path d="M72 70 a28 28 0 1 0 0 56 a22 22 0 1 1 0 -56z" fill={GOLD} />
          <path d="M38 160 q22 -34 44 0" fill="none" stroke={VIOLET} strokeWidth="3" />
          <circle cx="60" cy="150" r="3" fill={CREAM} />
        </g>
      );
    case 3: // 여황제: 꽃잎과 이삭
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => {
            const a = rad(60 * i);
            return <circle key={i} cx={60 + 22 * Math.cos(a)} cy={86 + 22 * Math.sin(a)} r="14" fill={i % 2 ? ROSE : '#f0a8a6'} opacity="0.9" />;
          })}
          <circle cx="60" cy="86" r="12" fill={GOLD} />
          <path d="M60 128 v52 M60 140 q-16 -4 -20 -18 M60 140 q16 -4 20 -18 M60 156 q-14 -2 -18 -14 M60 156 q14 -2 18 -14" stroke={TEAL} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case 4: // 황제: 네모난 옥좌와 양의 뿔
      return (
        <g>
          <rect x="30" y="60" width="60" height="96" fill="none" stroke={GOLD} strokeWidth="4" />
          <rect x="42" y="76" width="36" height="36" fill={ROSE} />
          <path d="M30 60 q-22 -4 -16 22 M90 60 q22 -4 16 22" fill="none" stroke={CREAM} strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="112" x2="60" y2="170" stroke={CREAM} strokeWidth="3" />
          <rect x="22" y="156" width="76" height="10" fill={VIOLET} />
        </g>
      );
    case 5: // 교황: 뾰족 아치와 세 단
      return (
        <g>
          <path d="M34 160 V90 q26 -56 52 0 V160z" fill="none" stroke={CREAM} strokeWidth="3" />
          <line x1="48" y1="76" x2="72" y2="76" stroke={GOLD} strokeWidth="4" />
          <line x1="44" y1="92" x2="76" y2="92" stroke={GOLD} strokeWidth="4" />
          <line x1="40" y1="108" x2="80" y2="108" stroke={GOLD} strokeWidth="4" />
          <line x1="60" y1="60" x2="60" y2="108" stroke={GOLD} strokeWidth="3" />
          <circle cx="42" cy="146" r="6" fill={TEAL} />
          <circle cx="78" cy="146" r="6" fill={ROSE} />
        </g>
      );
    case 6: // 연인: 겹친 두 원과 위의 태양
      return (
        <g>
          <circle cx="60" cy="40" r="12" fill={GOLD} />
          <Rays cx={60} cy={40} r1={16} r2={22} n={10} />
          <circle cx="46" cy="116" r="30" fill={ROSE} opacity="0.75" />
          <circle cx="74" cy="116" r="30" fill={TEAL} opacity="0.75" />
          <path d="M60 94 a30 30 0 0 1 0 44 a30 30 0 0 1 0 -44z" fill={CREAM} />
        </g>
      );
    case 7: // 전차: 마차와 두 바퀴, 밝고 어두운 반원
      return (
        <g>
          <path d="M26 60 q34 -26 68 0" fill="none" stroke={GOLD} strokeWidth="3" />
          <Star cx={60} cy={48} outer={7} inner={3} n={4} />
          <rect x="30" y="76" width="60" height="50" rx="4" fill={VIOLET} />
          <circle cx="40" cy="138" r="14" fill="none" stroke={CREAM} strokeWidth="4" />
          <circle cx="80" cy="138" r="14" fill="none" stroke={CREAM} strokeWidth="4" />
          <path d="M20 176 a14 14 0 0 1 28 0z" fill={CREAM} />
          <path d="M72 176 a14 14 0 0 1 28 0z" fill="#0b0d24" stroke={CREAM} strokeWidth="2" />
        </g>
      );
    case 8: // 힘: 갈기 같은 원과 다독이는 호
      return (
        <g>
          <path d="M44 38 c0 -12 16 -12 16 0 s16 12 16 0 s-16 -12 -16 0 s-16 12 -16 0z" fill="none" stroke={GOLD} strokeWidth="2.5" />
          <Rays cx={60} cy={110} r1={34} r2={46} n={16} color={GOLD} width={3} />
          <circle cx="60" cy="110" r="30" fill={ROSE} />
          <circle cx="50" cy="104" r="3" fill={NAVY} />
          <circle cx="70" cy="104" r="3" fill={NAVY} />
          <path d="M34 160 q26 22 52 0" fill="none" stroke={CREAM} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 9: // 은둔자: 산과 별빛 등불
      return (
        <g>
          <polygon points="10,170 54,70 98,170" fill={VIOLET} opacity="0.8" />
          <polygon points="52,170 88,100 120,170" fill="#7468d6" opacity="0.9" />
          <line x1="76" y1="62" x2="76" y2="150" stroke={CREAM} strokeWidth="3" />
          <Star cx={76} cy={50} outer={16} inner={6} n={6} />
          <circle cx="76" cy="50" r="5" fill={CREAM} />
          <polygon points="62,170 70,138 84,170" fill={CREAM} />
        </g>
      );
    case 10: // 운명의 수레바퀴
      return (
        <g>
          <circle cx="60" cy="100" r="46" fill="none" stroke={GOLD} strokeWidth="4" />
          <circle cx="60" cy="100" r="14" fill={GOLD} />
          <Rays cx={60} cy={100} r1={14} r2={46} n={8} color={CREAM} width={3} />
          {Array.from({ length: 4 }, (_, i) => {
            const a = rad(90 * i + 45);
            const fills = [TEAL, ROSE, VIOLET, TEAL];
            return <circle key={i} cx={60 + 60 * Math.cos(a)} cy={100 + 60 * Math.sin(a)} r="7" fill={fills[i]} />;
          })}
        </g>
      );
    case 11: // 정의: 저울과 검
      return (
        <g fill="none" strokeLinecap="round">
          <line x1="60" y1="40" x2="60" y2="170" stroke={CREAM} strokeWidth="4" />
          <line x1="24" y1="70" x2="96" y2="70" stroke={GOLD} strokeWidth="4" />
          <path d="M24 70 l-12 40 h24z M96 70 l-12 40 h24z" stroke={GOLD} strokeWidth="2" />
          <path d="M8 110 a16 10 0 0 0 32 0z" fill={TEAL} stroke="none" />
          <path d="M80 110 a16 10 0 0 0 32 0z" fill={ROSE} stroke="none" />
          <polygon points="56,30 64,30 60,16" fill={GOLD} stroke="none" />
        </g>
      );
    case 12: // 매달린 사람: 거꾸로 선 삼각형과 후광
      return (
        <g>
          <line x1="20" y1="44" x2="100" y2="44" stroke={CREAM} strokeWidth="5" strokeLinecap="round" />
          <line x1="60" y1="44" x2="60" y2="84" stroke={CREAM} strokeWidth="3" />
          <polygon points="42,84 78,84 60,146" fill={VIOLET} />
          <circle cx="60" cy="158" r="14" fill="none" stroke={GOLD} strokeWidth="3" />
          <circle cx="60" cy="158" r="6" fill={CREAM} />
          <path d="M26 112 q-6 20 0 40 M94 112 q6 20 0 40" stroke={TEAL} strokeWidth="2" fill="none" />
        </g>
      );
    case 13: // 변화: 지평선 위로 뜨는 해와 나비 같은 두 잎
      return (
        <g>
          <path d="M30 140 a30 30 0 0 1 60 0z" fill={GOLD} />
          <Rays cx={60} cy={140} r1={36} r2={46} n={9} offset={180} />
          <path d="M60 110 c-30 -50 -52 -6 -14 6 c-12 6 0 20 14 -6z" fill={ROSE} opacity="0.9" />
          <path d="M60 110 c30 -50 52 -6 14 6 c12 6 0 20 -14 -6z" fill={VIOLET} opacity="0.9" />
          <line x1="12" y1="140" x2="108" y2="140" stroke={CREAM} strokeWidth="3" />
          <path d="M26 156 h68 M38 168 h44" stroke={CREAM} strokeWidth="2" opacity="0.5" />
        </g>
      );
    case 14: // 절제: 두 잔 사이로 흐르는 물
      return (
        <g fill="none" strokeLinecap="round">
          <circle cx="60" cy="40" r="10" fill={GOLD} stroke="none" />
          <path d="M20 90 h30 l-5 28 h-20z" fill={TEAL} stroke="none" />
          <path d="M70 128 h30 l-5 28 h-20z" fill={ROSE} stroke="none" />
          <path d="M50 94 q34 0 24 32" stroke={CREAM} strokeWidth="3" />
          <path d="M34 78 q26 -22 52 0" stroke={GOLD} strokeWidth="2.5" />
          <path d="M14 172 q12 -8 24 0 t24 0 t24 0 t24 0" stroke={VIOLET} strokeWidth="3" />
        </g>
      );
    case 15: // 속박: 느슨한 사슬에 묶인 두 점
      return (
        <g fill="none">
          <polygon points="60,138 30,70 90,70" fill="none" stroke={ROSE} strokeWidth="4" />
          <circle cx="60" cy="96" r="22" stroke={GOLD} strokeWidth="2" strokeDasharray="4 5" />
          <circle cx="34" cy="150" r="8" fill={CREAM} stroke="none" />
          <circle cx="86" cy="150" r="8" fill={CREAM} stroke="none" />
          <ellipse cx="48" cy="150" rx="8" ry="4" stroke={TEAL} strokeWidth="2.5" />
          <ellipse cx="60" cy="150" rx="8" ry="4" stroke={TEAL} strokeWidth="2.5" />
          <ellipse cx="72" cy="150" rx="8" ry="4" stroke={TEAL} strokeWidth="2.5" />
        </g>
      );
    case 16: // 무너지는 탑: 갈라진 탑과 번개
      return (
        <g>
          <rect x="44" y="94" width="32" height="74" fill={CREAM} />
          <rect x="38" y="60" width="44" height="26" fill={CREAM} transform="rotate(-12 60 73)" />
          <polyline points="86,24 70,70 82,70 62,112" fill="none" stroke={GOLD} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="28" cy="110" r="4" fill={ROSE} />
          <circle cx="96" cy="130" r="4" fill={ROSE} />
          <circle cx="30" cy="140" r="3" fill={GOLD} />
          <circle cx="92" cy="100" r="3" fill={VIOLET} />
          <line x1="14" y1="168" x2="106" y2="168" stroke={CREAM} strokeWidth="3" />
        </g>
      );
    case 17: // 별: 큰 별과 일곱 작은 별, 물결
      return (
        <g>
          <Star cx={60} cy={78} outer={36} inner={13} n={8} />
          {[[24, 40], [96, 38], [18, 100], [102, 96], [34, 128], [86, 130], [60, 20]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill={CREAM} />
          ))}
          <path d="M10 150 q12 -10 25 0 t25 0 t25 0 t25 0" fill="none" stroke={TEAL} strokeWidth="3" />
          <path d="M10 166 q12 -10 25 0 t25 0 t25 0 t25 0" fill="none" stroke={TEAL} strokeWidth="3" opacity="0.6" />
        </g>
      );
    case 18: // 달: 큰 달과 두 탑, 구불구불한 길
      return (
        <g>
          <circle cx="60" cy="62" r="30" fill={CREAM} />
          <circle cx="72" cy="56" r="26" fill={NAVY} />
          <rect x="14" y="104" width="18" height="62" fill={VIOLET} />
          <rect x="88" y="104" width="18" height="62" fill={VIOLET} />
          <path d="M60 170 q-24 -16 0 -30 t0 -30" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
          <circle cx="46" cy="30" r="2" fill={GOLD} />
          <circle cx="94" cy="40" r="2" fill={GOLD} />
          <circle cx="24" cy="60" r="2" fill={GOLD} />
        </g>
      );
    case 19: // 태양: 열두 광선과 해바라기 담
      return (
        <g>
          <Rays cx={60} cy={76} r1={34} r2={52} n={12} width={3} />
          <circle cx="60" cy="76" r="28" fill={GOLD} />
          <circle cx="52" cy="72" r="3" fill={NAVY} />
          <circle cx="68" cy="72" r="3" fill={NAVY} />
          <path d="M50 86 q10 8 20 0" fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
          <rect x="14" y="150" width="92" height="20" fill={ROSE} opacity="0.85" />
          {[28, 52, 76, 98].map((x) => (
            <circle key={x} cx={x} cy="142" r="7" fill={GOLD} />
          ))}
        </g>
      );
    case 20: // 심판: 나팔과 일어서는 세 사람
      return (
        <g>
          <polygon points="28,48 100,28 100,68" fill={GOLD} />
          <circle cx="24" cy="52" r="7" fill={CREAM} />
          <path d="M20 96 q14 -14 28 0 t28 0 t28 0" fill="none" stroke={CREAM} strokeWidth="3" opacity="0.7" />
          {[30, 60, 90].map((x, i) => (
            <g key={x}>
              <rect x={x - 7} y={128 - i * 4} width="14" height={40 + i * 4} rx="3" fill={[TEAL, ROSE, VIOLET][i]} />
              <circle cx={x} cy={118 - i * 4} r="6" fill={CREAM} />
            </g>
          ))}
          <line x1="14" y1="172" x2="106" y2="172" stroke={CREAM} strokeWidth="2" />
        </g>
      );
    case 21: // 세계: 월계관 고리와 네 모퉁이
      return (
        <g>
          <ellipse cx="60" cy="100" rx="36" ry="58" fill="none" stroke={TEAL} strokeWidth="4" />
          {Array.from({ length: 10 }, (_, i) => {
            const a = rad(18 + 36 * i);
            return <ellipse key={i} cx={60 + 36 * Math.cos(a)} cy={100 + 58 * Math.sin(a)} rx="3" ry="7" fill={TEAL} transform={`rotate(${36 * i + 18} ${60 + 36 * Math.cos(a)} ${100 + 58 * Math.sin(a)})`} />;
          })}
          <polygon points="60,72 80,100 60,128 40,100" fill={GOLD} />
          {[[16, 28], [104, 28], [16, 172], [104, 172]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={[ROSE, VIOLET, CREAM, GOLD][i]} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** 카드 앞면 그림. 비율은 3:5 (120×200) */
export default function TarotArt({ id, className }: { id: number; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 200" className={className} role="img" aria-label="타로 카드 일러스트">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262a5e" />
          <stop offset="1" stopColor="#0f1130" />
        </linearGradient>
      </defs>
      <rect width="120" height="200" rx="10" fill={`url(#bg-${uid})`} />
      <rect x="5" y="5" width="110" height="190" rx="7" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.8" />
      <g transform="translate(0 4)">
        <Motif id={id} />
      </g>
    </svg>
  );
}

/** 뒤집혀 있는 카드 뒷면 */
export function TarotBack({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden>
      <defs>
        <linearGradient id={`back-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262a5e" />
          <stop offset="1" stopColor="#0f1130" />
        </linearGradient>
      </defs>
      <rect width="120" height="200" rx="10" fill={`url(#back-${uid})`} />
      <rect x="5" y="5" width="110" height="190" rx="7" fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.8" />
      <circle cx="60" cy="100" r="30" fill="none" stroke={GOLD} strokeWidth="1.5" />
      <circle cx="60" cy="100" r="18" fill="none" stroke={CREAM} strokeWidth="1" opacity="0.7" />
      <Rays cx={60} cy={100} r1={34} r2={46} n={16} width={1.5} />
      <Star cx={60} cy={100} outer={10} inner={4} n={4} color={CREAM} />
    </svg>
  );
}
