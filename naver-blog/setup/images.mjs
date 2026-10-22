// 블로그 이미지 생성 — 프로필 / 타이틀 / 카테고리 대표
// 디자인 언어: 맑은 면 v4 (바탕 #f3f3f1, 먹 #15171a, 쪽빛 #22457a)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets');
fs.mkdirSync(OUT, { recursive: true });
const GROUND = '#f3f3f1', INK = '#15171a', BLUE = '#22457a', MUTE = '#8d9199';
const KR = 'Apple SD Gothic Neo, Noto Sans KR, sans-serif';

// 공통 마크: 원(렌즈) + 수평선(지평) — 진단과 여행
const mark = (cx, cy, r, c = BLUE, w = 2) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${c}"/>
  <line x1="${cx - r * 2.1}" y1="${cy}" x2="${cx - r * 1.25}" y2="${cy}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>
  <line x1="${cx + r * 1.25}" y1="${cy}" x2="${cx + r * 2.1}" y2="${cy}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;

const files = [];
const emit = async (name, svg, w, h) => {
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${svg}</svg>`))
    .png().toFile(path.join(OUT, name));
  files.push(`${name}  ${w}×${h}`);
};

// ── 프로필 161×161 ──
await emit('프로필.png', `
  <rect width="161" height="161" fill="${GROUND}"/>
  <rect x="0.5" y="0.5" width="160" height="160" fill="none" stroke="#e2e2de"/>
  ${mark(80.5, 68, 26, BLUE, 2.2)}
  <text x="80.5" y="126" text-anchor="middle" font-family="${KR}" font-size="19" font-weight="600" fill="${INK}" letter-spacing="2">이안사랑</text>`, 161, 161);

// ── 타이틀 배너 966×300 ──
await emit('타이틀.png', `
  <rect width="966" height="300" fill="${GROUND}"/>
  <line x1="0" y1="299.5" x2="966" y2="299.5" stroke="#e2e2de"/>
  ${mark(118, 150, 34, BLUE, 2.4)}
  <text x="206" y="140" font-family="${KR}" font-size="44" font-weight="700" fill="${INK}" letter-spacing="4">이안사랑</text>
  <text x="208" y="178" font-family="${KR}" font-size="16" fill="${MUTE}" letter-spacing="1.2">진단과 여행, 그리고 읽은 것을 기록합니다</text>
  <line x1="208" y1="200" x2="268" y2="200" stroke="${BLUE}" stroke-width="2"/>`, 966, 300);

// ── 대분류 대표 이미지 800×420 ──
const cats = [
  ['01', '아람비즈니스', '두피·피부 진단을 만드는 자리에서'],
  ['02', '여행', '다녀온 도시와 거기서 배운 것'],
  ['03', '읽고 생각한 것', '읽은 문장과 남은 생각'],
  ['04', '함께하는 사람들', '셀피쉬클럽 · 스폰지클럽 · 공유회'],
];
for (const [no, name, sub] of cats) {
  await emit(`카테고리-${no}.png`, `
    <rect width="800" height="420" fill="${GROUND}"/>
    <rect x="48" y="48" width="704" height="324" fill="none" stroke="#e2e2de"/>
    <text x="80" y="116" font-family="${KR}" font-size="13" font-weight="600" fill="${BLUE}" letter-spacing="3">${no}</text>
    <text x="80" y="196" font-family="${KR}" font-size="40" font-weight="700" fill="${INK}" letter-spacing="1">${name}</text>
    <line x1="80" y1="226" x2="140" y2="226" stroke="${BLUE}" stroke-width="2"/>
    <text x="80" y="268" font-family="${KR}" font-size="16" fill="${MUTE}">${sub}</text>
    ${mark(672, 300, 22, '#c9ccd2', 1.8)}`, 800, 420);
}

console.log('만든 파일 (' + OUT.replace(process.env.HOME, '~') + ')');
for (const f of files) console.log('  ' + f);
