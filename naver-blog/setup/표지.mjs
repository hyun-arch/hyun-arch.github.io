// 글마다 대표 이미지(표지)를 만든다. 타이틀·프로필과 같은 결.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/표지');
fs.mkdirSync(OUT, { recursive: true });
const G = '#f3f3f1', INK = '#15171a', BLUE = '#22457a', MUTE = '#8d9199';
const KR = 'Apple SD Gothic Neo, Noto Sans KR, sans-serif';
const mark = (cx, cy, r, c, w) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${c}"/>
  <line x1="${cx - r * 2.1}" y1="${cy}" x2="${cx - r * 1.25}" y2="${cy}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>
  <line x1="${cx + r * 1.25}" y1="${cy}" x2="${cx + r * 2.1}" y2="${cy}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const wrap = (s, n) => { const w = s.split(' '); const out = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x; } else l += ' ' + x; } if (l.trim()) out.push(l.trim()); return out.slice(0, 3); };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const JOBS = [
  ['224447201524', '머스크에게 배운 것', '강박 · 알고리즘 · 하드코어', '31 서재'],
  ['224447202775', '일론 머스크와 스페이스X', '정부의 일을 민간이 해내다', '31 서재'],
  ['224447202521', '나를 구하는 유일한 길은, 남을 구하는 것', '아람휴비스가 걷는 진단의 철학', '11 진단 이야기'],
];
for (const [no, title, sub, cat] of JOBS) {
  const lines = wrap(title, 16);
  const body = lines.map((l, i) => `<text x="80" y="${196 + i * 52}" font-family="${KR}" font-size="38" font-weight="700" fill="${INK}">${esc(l)}</text>`).join('');
  const y = 196 + lines.length * 52;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
    <rect width="800" height="420" fill="${G}"/>
    <rect x="48" y="48" width="704" height="324" fill="none" stroke="#e2e2de"/>
    <text x="80" y="116" font-family="${KR}" font-size="13" font-weight="600" fill="${BLUE}" letter-spacing="2">${esc(cat)}</text>
    ${body}
    <line x1="80" y1="${y}" x2="140" y2="${y}" stroke="${BLUE}" stroke-width="2"/>
    <text x="80" y="${y + 40}" font-family="${KR}" font-size="16" fill="${MUTE}">${esc(sub)}</text>
    ${mark(672, 300, 22, '#c9ccd2', 1.8)}</svg>`;
  const file = path.join(OUT, `${no}.png`);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log('  만듦  ' + path.basename(file) + '  ' + title.slice(0, 22));
}
