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
// 「정리」의 요점을 모은 카드 — 소제목이 적은 글은 이게 없으면 5장을 못 채운다.
// 채우려고 넣는 게 아니라, 요점만 모은 장이 한 장 있는 편이 읽는 사람에게 낫다.
const 정리줄 = [];
let 정리중 = false;
for (const l of 줄) {
  if (/^##\s+정리/.test(l)) { 정리중 = true; continue; }
  if (정리중 && /^##\s/.test(l)) break;
  if (정리중 && /^[-*·]\s+/.test(l.trim())) {
    정리줄.push(l.trim().replace(/^[-*·]\s+/, '').replace(/\*\*/g, ''));
  }
}
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
  .q { font-size:62px; line-height:1.26; font-weight:800; letter-spacing:-1.2px; word-break:keep-all; }
  .a { font-size:35px; line-height:1.58; font-weight:500; opacity:.93; margin-top:28px; word-break:keep-all; }
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

// 표지 — 앨범형 목록에서 **작게 줄여 봐도 읽히게** 만든다.
// 전에 못났던 이유 세 가지 (2026-10-23 부사장 지적):
//   ① 한글이 단어 중간에서 잘렸다 (「모공이 넓어 보 / 이는」) → word-break:keep-all
//   ② 글자가 아래로 쏠려 가운데가 텅 비었다 → 세로 가운데 정렬
//   ③ 제목이 길면 넘쳤다 → 길이에 따라 글자 크기를 바꾼다
const 글자크기 = (n) => (n <= 16 ? 92 : n <= 24 ? 78 : n <= 32 ? 66 : n <= 40 ? 58 : 50);
const 표지제목 = 제목.replace(/^[^,]*,\s*/, (m) => m);   // 제목은 그대로 쓴다
const 표지 = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:${BR.bg}; color:${BR.ink}; position:relative; overflow:hidden;
    padding:88px 84px; display:flex; flex-direction:column; justify-content:center; }
  /* 단색이면 심심하다. 큰 원 하나로 깊이를 준다 */
  .blob { position:absolute; width:900px; height:900px; border-radius:50%;
    right:-280px; top:-300px; background:${BR.bg2}; opacity:.85; }
  .blob2 { position:absolute; width:520px; height:520px; border-radius:50%;
    left:-200px; bottom:-220px; background:${BR.bg2}; opacity:.5; }
  .inner { position:relative; z-index:1; }
  .kicker { font-size:30px; letter-spacing:3px; font-weight:700; color:${BR.chip}; }
  .rule { width:92px; height:9px; background:${BR.chip}; border-radius:5px; margin:26px 0 34px; }
  .title { font-size:${글자크기([...표지제목].length)}px; line-height:1.3; font-weight:800;
    letter-spacing:-1.5px; word-break:keep-all; overflow-wrap:break-word; }
  .foot { position:absolute; left:84px; right:84px; bottom:76px; z-index:1;
    display:flex; justify-content:space-between; align-items:flex-end; font-size:29px; }
  .brand { font-weight:800; } .tag { opacity:.82; font-weight:600; }
</style></head><body>
  <div class="blob"></div><div class="blob2"></div>
  <div class="inner">
    <div class="kicker">측정 기반 · 아람휴비스</div>
    <div class="rule"></div>
    <div class="title">${esc(표지제목)}</div>
  </div>
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
// 요점 카드 — 「정리」 불릿을 한 장에 모은다
if (정리줄.length >= 2) {
  const 요점 = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:linear-gradient(135deg,${BR.bg} 0%,${BR.bg2} 100%); color:${BR.ink};
    padding:92px 88px; display:flex; flex-direction:column; justify-content:space-between; }
  .kicker { font-size:28px; letter-spacing:4px; font-weight:700; color:${BR.chip}; }
  .h { font-size:62px; font-weight:800; letter-spacing:-1px; margin-top:18px; }
  ul { list-style:none; margin-top:44px; }
  li { font-size:36px; line-height:1.5; font-weight:500; margin-bottom:26px;
       padding-left:34px; position:relative; }
  li:before { content:""; position:absolute; left:0; top:20px; width:18px; height:6px;
              background:${BR.chip}; border-radius:3px; }
  .foot { display:flex; justify-content:space-between; align-items:flex-end; font-size:28px; }
  .brand { font-weight:800; } .tag { opacity:.8; font-weight:600; }
</style></head><body>
  <div><div class="kicker">측정 기반 · 아람휴비스</div><div class="h">정리</div></div>
  <ul>${정리줄.slice(0, 5).map((x) => `<li>${esc(짧게(x, 62))}</li>`).join('')}</ul>
  <div class="foot"><div class="brand">${BR.name}</div><div class="tag">#측정으로_갈린다</div></div>
</body></html>`;
  만든것.push(await 저장(`fig-${String(카드.length + 1).padStart(2, '0')}.png`, 요점));
}
await browser.close();

console.log(`\n  그림 ${만든것.length}장. 원고에 아직 안 박혀 있으면 아래를 소제목 밑에 넣으세요:`);
만든것.forEach((f) => console.log(`    ![](${f})`));
