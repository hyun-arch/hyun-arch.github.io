#!/usr/bin/env node
// 글의 **소제목과 그 답**으로 도표 카드를 만든다.
//
//   node naver-blog/make-figures.mjs naver-blog/posts/2026-10-22-두피냄새 relai
//   node naver-blog/make-figures.mjs <글폴더> <brand> [--덮어쓰기]
//
// 왜 (2026-10-23) —
//   검사가 이미지 5장을 요구한다. 아무 그림이나 채우면 독자에게 쓸모가 없다.
//   글의 소제목은 이미 「독자가 묻는 질문」이고, 그 밑 첫 문단이 답이다.
//   그 둘을 카드로 만들면 **글을 안 읽고 그림만 넘겨도 요지가 남는다.**
//   파일 이름은 post.md 안의 ![](...) 순서와 맞춘다.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [, , 글폴더, brand = 'relai'] = process.argv;
const 덮어쓰기 = process.argv.includes('--덮어쓰기');
if (!글폴더) {
  console.log('쓰는 법: node naver-blog/make-figures.mjs <글폴더> <relai|ellapiel|medicustom|b2b> [--덮어쓰기]');
  process.exit(1);
}
const 원고길 = path.join(글폴더, 'post.md');
if (!fs.existsSync(원고길)) { console.log('원고가 없습니다:', 원고길); process.exit(1); }

const BR = {
  relai: { name: '릴라이 · 두피', bg: '#0f766e', bg2: '#115e59', ink: '#ecfdf5', chip: '#5eead4' },
  ellapiel: { name: '엘라피엘 · 피부', bg: '#9d174d', bg2: '#831843', ink: '#fff1f2', chip: '#fda4af' },
  medicustom: { name: '메디커스텀 · 손상피부', bg: '#1e3a8a', bg2: '#1e40af', ink: '#eff6ff', chip: '#93c5fd' },
  b2b: { name: '아람휴비스 · B2B', bg: '#1f2937', bg2: '#111827', ink: '#f9fafb', chip: '#cbd5e1' },
}[brand];
if (!BR) { console.log('brand는 relai|ellapiel|medicustom|b2b 중 하나'); process.exit(1); }

const raw = fs.readFileSync(원고길, 'utf8');
const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ''])[1].trim();

// 소제목과 그 바로 밑 첫 문단을 짝지어 모은다
const 줄 = raw.split('\n');
const 카드 = [];
for (let i = 0; i < 줄.length; i += 1) {
  const h = 줄[i].match(/^##\s+(.+)$/);
  if (!h) continue;
  const 소제목 = h[1].trim();
  if (/^정리$/.test(소제목)) continue;
  let 답 = '';
  for (let j = i + 1; j < 줄.length; j += 1) {
    const t = 줄[j].trim();
    if (/^#/.test(t)) break;
    if (!t || /^!\[/.test(t) || /^\|/.test(t)) continue;
    답 = t.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*·]\s*/, '').trim();
    break;
  }
  카드.push({ 소제목, 답 });
}
if (카드.length < 2) { console.log('소제목이 모자랍니다. 카드를 못 만듭니다.'); process.exit(1); }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 짧게 = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s\S*$/, '') + '…');

const 그리기 = (번호, 소제목, 답) => `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:linear-gradient(135deg,${BR.bg} 0%,${BR.bg2} 100%); color:${BR.ink};
    padding:92px 88px; display:flex; flex-direction:column; justify-content:space-between; }
  .kicker { font-size:28px; letter-spacing:4px; font-weight:700; color:${BR.chip}; }
  .num { font-size:160px; font-weight:800; line-height:1; color:${BR.chip}; opacity:.35; }
  .q { font-size:66px; line-height:1.22; font-weight:800; letter-spacing:-1.2px; text-wrap:balance; }
  .a { font-size:36px; line-height:1.55; font-weight:500; opacity:.93; margin-top:30px; }
  .rule { width:110px; height:8px; background:${BR.chip}; border-radius:4px; margin:34px 0 0; }
  .foot { display:flex; justify-content:space-between; align-items:flex-end; font-size:28px; }
  .brand { font-weight:800; }
  .tag { opacity:.8; font-weight:600; }
</style></head><body>
  <div><div class="kicker">측정 기반 · 아람휴비스</div><div class="num">${번호}</div></div>
  <div>
    <div class="q">${esc(소제목)}</div>
    ${답 ? `<div class="a">${esc(짧게(답, 150))}</div>` : ''}
    <div class="rule"></div>
  </div>
  <div class="foot"><div class="brand">${BR.name}</div><div class="tag">#측정으로_갈린다</div></div>
</body></html>`;

const 표지 = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:linear-gradient(135deg,${BR.bg} 0%,${BR.bg2} 100%); color:${BR.ink};
    padding:96px 92px; display:flex; flex-direction:column; justify-content:space-between; }
  .kicker { font-size:30px; letter-spacing:4px; font-weight:700; color:${BR.chip}; }
  .title { font-size:84px; line-height:1.18; font-weight:800; letter-spacing:-1.5px; text-wrap:balance; }
  .rule { width:120px; height:8px; background:${BR.chip}; border-radius:4px; margin:40px 0 0; }
  .foot { display:flex; justify-content:space-between; align-items:flex-end; font-size:30px; }
  .brand { font-weight:800; } .tag { opacity:.8; font-weight:600; }
</style></head><body>
  <div><div class="kicker">측정 기반 · 아람휴비스</div><div class="rule"></div></div>
  <div class="title">${esc(제목)}</div>
  <div class="foot"><div class="brand">${BR.name}</div><div class="tag">#측정으로_갈린다</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

const 만든것 = [];
const 저장 = async (이름, html) => {
  const out = path.join(글폴더, 이름);
  if (fs.existsSync(out) && !덮어쓰기) { console.log(`  건너뜀(이미 있음): ${이름}`); return 이름; }
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: out });
  console.log(`  만듦: ${이름}`);
  return 이름;
};

만든것.push(await 저장('cover.png', 표지));
for (const [i, c] of 카드.entries()) {
  만든것.push(await 저장(`fig-${String(i + 1).padStart(2, '0')}.png`, 그리기(i + 1, c.소제목, c.답)));
}
await browser.close();

console.log(`\n  그림 ${만든것.length}장. 원고에 아직 안 박혀 있으면 아래를 소제목 밑에 넣으세요:`);
만든것.forEach((f) => console.log(`    ![](${f})`));
