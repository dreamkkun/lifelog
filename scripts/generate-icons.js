// `npm run icons` — public/ 아래 PWA 아이콘과 favicon 을 생성한다. (외부 의존성 없음)
// 디자인: 슬레이트 배경 위에 노트 한 장 + 카테고리 도트(일기·독서·강의).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const BG = [15, 23, 42]; // slate-900
const PAGE = [248, 250, 252];
const LINE = [203, 213, 225];
const DOTS = [
  [0.39, [16, 185, 129]], // emerald
  [0.5, [99, 102, 241]], // indigo
  [0.61, [245, 158, 11]], // amber
];

function sdRoundRect(px, py, cx, cy, hx, hy, r) {
  const qx = Math.abs(px - cx) - hx + r;
  const qy = Math.abs(py - cy) - hy + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// (u,v) ∈ [0,1]² → RGBA. rounded: 모서리를 투명하게, scale: 내용물 축소(maskable 안전 영역)
function sample(u, v, { rounded, scale }) {
  if (rounded && sdRoundRect(u, v, 0.5, 0.5, 0.5, 0.5, 0.18) > 0) return [0, 0, 0, 0];
  const x = (u - 0.5) / scale + 0.5;
  const y = (v - 0.5) / scale + 0.5;
  for (const [cx, color] of DOTS) {
    if (Math.hypot(x - cx, y - 0.63) < 0.04) return [...color, 255];
  }
  if (x > 0.34 && x < 0.66 && y > 0.3 && y < 0.34) return [...LINE, 255];
  if (x > 0.34 && x < 0.58 && y > 0.4 && y < 0.44) return [...LINE, 255];
  if (sdRoundRect(x, y, 0.5, 0.5, 0.23, 0.3, 0.06) < 0) return [...PAGE, 255];
  return [...BG, 255];
}

function render(size, opts) {
  const SS = 4; // 4x4 슈퍼샘플링으로 안티앨리어싱
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, opts);
          r += c[0] * c[3]; g += c[1] * c[3]; b += c[2] * c[3]; a += c[3];
        }
      }
      const o = py * (size * 4 + 1) + 1 + px * 4;
      if (a > 0) {
        raw[o] = Math.round(r / a);
        raw[o + 1] = Math.round(g / a);
        raw[o + 2] = Math.round(b / a);
        raw[o + 3] = Math.round(a / (SS * SS));
      }
    }
  }
  return encodePng(size, raw);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// PNG 를 담은 단일 이미지 ICO
function encodeIco(png, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // count
  head[6] = size; head[7] = size;
  head.writeUInt16LE(1, 10); // planes
  head.writeUInt16LE(32, 12); // bpp
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
}

const write = (file, buf) => {
  fs.writeFileSync(file, buf);
  console.log('created', path.relative(root, file));
};

write(path.join(iconsDir, 'icon-192x192.png'), render(192, { rounded: true, scale: 1 }));
write(path.join(iconsDir, 'icon-512x512.png'), render(512, { rounded: true, scale: 1 }));
// maskable: 전체를 배경으로 채우고 내용은 안전 영역(중앙 80%) 안에 둔다
write(path.join(iconsDir, 'maskable-icon-512x512.png'), render(512, { rounded: false, scale: 0.8 }));
// iOS 는 투명 영역을 검정으로 채우므로 불투명 + 자체 모서리 처리에 맡긴다
write(path.join(root, 'public', 'apple-touch-icon.png'), render(180, { rounded: false, scale: 0.9 }));
write(path.join(root, 'src', 'app', 'favicon.ico'), encodeIco(render(32, { rounded: true, scale: 1 }), 32));
