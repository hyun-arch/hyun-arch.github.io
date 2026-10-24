#!/usr/bin/env node
// 표지 한 장만 만든다. 원고 폴더가 없는 글(옛 글)에 쓴다.
//
//   node naver-blog/cover-one.mjs "윗줄" "아랫줄" <brand> <나올파일.png>
//   brand: relai | ellapiel | medicustom | b2b
//
// 왜 (2026-10-24) —
//   예전에 올린 글 중에 **썸네일이 아예 없거나**(네이버 기본 아이콘),
//   가로로 긴 카드라 앨범형에서 글자가 잘리는 것들이 있었다.
//   앨범형은 정사각으로 자르기 때문에 가로 카드는 양옆이 날아간다.
import path from 'node:path';
import { chromium } from 'playwright';

const [, , 윗줄 = '', 아랫줄 = '', brand = 'b2b', out = 'cover.png'] = process.argv;
if (!윗줄) { console.log('쓰는 법: node naver-blog/cover-one.mjs "윗줄" "아랫줄" <brand> <out.png>'); process.exit(1); }

const BR = {
  relai: { name: '릴라이 · 두피', bg: '#0f766e', bg2: '#115e59', ink: '#ecfdf5', chip: '#5eead4' },
  ellapiel: { name: '엘라피엘 · 피부', bg: '#9d174d', bg2: '#831843', ink: '#fff1f2', chip: '#fda4af' },
  medicustom: { name: '메디커스텀 · 손상피부', bg: '#1e3a8a', bg2: '#1e40af', ink: '#eff6ff', chip: '#93c5fd' },
  b2b: { name: '아람휴비스', bg: '#1f2937', bg2: '#111827', ink: '#f9fafb', chip: '#cbd5e1' },
}[brand];
if (!BR) { console.log('brand 는 relai|ellapiel|medicustom|b2b'); process.exit(1); }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const 긴쪽 = Math.max([...윗줄].length, [...아랫줄].length);
const 크기 = 긴쪽 <= 6 ? 190 : 긴쪽 <= 8 ? 168 : 긴쪽 <= 10 ? 146 : 긴쪽 <= 12 ? 128 : 112;

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:${BR.bg}; color:${BR.ink}; position:relative; overflow:hidden;
    padding:84px 78px; display:flex; flex-direction:column; justify-content:center; }
  .blob { position:absolute; width:940px; height:940px; border-radius:50%;
    right:-300px; top:-330px; background:${BR.bg2}; opacity:.9; }
  .blob2 { position:absolute; width:540px; height:540px; border-radius:50%;
    left:-220px; bottom:-240px; background:${BR.bg2}; opacity:.55; }
  .inner { position:relative; z-index:1; }
  .rule { width:120px; height:14px; background:${BR.chip}; border-radius:7px; margin-bottom:40px; }
  .l1 { font-size:${크기}px; line-height:1.14; font-weight:800; letter-spacing:-3px; word-break:keep-all; }
  .l2 { font-size:${Math.round(크기 * 0.84)}px; line-height:1.16; font-weight:800;
        letter-spacing:-3px; color:${BR.chip}; word-break:keep-all; margin-top:10px; }
  .foot { position:absolute; left:78px; right:78px; bottom:64px; z-index:1;
    display:flex; justify-content:space-between; align-items:flex-end; font-size:34px; }
  .brand { font-weight:800; opacity:.95; } .tag { opacity:.75; font-weight:700; }
</style></head><body>
  <div class="blob"></div><div class="blob2"></div>
  <div class="inner">
    <div class="rule"></div>
    <div class="l1">${esc(윗줄)}</div>
    ${아랫줄 ? `<div class="l2">${esc(아랫줄)}</div>` : ''}
  </div>
  <div class="foot"><div class="brand">${BR.name}</div><div class="tag">측정으로 갈린다</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.resolve(out) });
await browser.close();
console.log('만듦:', out);
