#!/usr/bin/env node
// 발행된 글의 표지를 **창 하나로** 전부 바꾼다.
//
//   NAVER_HEADLESS=0 node publish/cover-run.mjs            무엇을 바꿀지만
//   NAVER_HEADLESS=0 node publish/cover-run.mjs --적용
//   ... --옛글                                              옛 글(원고 없는 것)도 같이
//
// 왜 다시 만들었나 (2026-10-24) —
//   전에는 글 한 편마다 브라우저를 열고 닫았다. **24번 여닫았다.**
//   그래서 사람이 로그인해 둬도 다음 글에서 창이 닫혀 버렸다.
//   창은 **처음에 한 번만 열고 끝까지 들고 간다.** 중간에 절대 안 닫는다.
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser } from './naver-open.mjs';

const 적용 = process.argv.includes('--적용');
const 옛글도 = process.argv.includes('--옛글');
const blogId = 'ianlove80';
const 뿌리 = path.resolve('naver-blog/posts');

const 납작 = (x) => x.replace(/[\s,·—–\-'"?!()]/g, '');
const 조각 = (x) => {
  const n = 납작(x).replace(/[^가-힣A-Za-z0-9]/g, '');
  const s = new Set();
  for (let i = 0; i + 2 <= n.length; i += 1) s.add(n.slice(i, i + 2));
  return s;
};
const 닮음 = (a, b) => {
  const A = 조각(a); const B = 조각(b);
  if (!A.size || !B.size) return 0;
  let c = 0; A.forEach((x) => { if (B.has(x)) c += 1; });
  return c / Math.max(A.size, B.size);
};

const 올라간것 = [];
for (let p = 1; p <= 4; p += 1) {
  const t = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${p}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
    { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
  const 전 = 올라간것.length;
  for (const m of t.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
    올라간것.push([m[1], decodeURIComponent(m[2].replace(/\+/g, ' '))]);
  }
  if (올라간것.length === 전) break;
}

const 할것 = [];
for (const d of fs.readdirSync(뿌리).sort()) {
  const md = path.join(뿌리, d, 'post.md');
  const cover = path.join(뿌리, d, 'cover.png');
  if (!fs.existsSync(md) || !fs.existsSync(cover)) continue;
  const 제목 = (fs.readFileSync(md, 'utf8').match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const 짝 = 올라간것.find(([, t]) => 닮음(제목, t) >= 0.6);
  if (짝) 할것.push({ id: 짝[0], 제목, cover });
}
// 원고가 없는 옛 글 — naver-blog/covers-old/<글ID>.png 를 쓴다
if (옛글도) {
  const 옛 = path.resolve('naver-blog/covers-old');
  if (fs.existsSync(옛)) {
    for (const f of fs.readdirSync(옛).filter((x) => /^\d{9,}\.png$/.test(x))) {
      const id = f.replace('.png', '');
      if (할것.some((x) => x.id === id)) continue;
      const 제목 = (올라간것.find(([i]) => i === id) || [, '(옛 글)'])[1];
      할것.push({ id, 제목, cover: path.join(옛, f) });
    }
  }
}

console.log(`  표지를 바꿀 글 ${할것.length}편\n`);
할것.forEach((x) => console.log(`  ${x.id}  ${x.제목.slice(0, 38)}`));
if (!적용) { console.log('\n  실제로 바꾸려면 --적용 을 붙이세요.'); process.exit(0); }

// ── 창을 연다. 끝까지 안 닫는다 ───────────────────────────────
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { await d.accept().catch(() => {}); });
process.on('SIGTERM', () => console.log('SIGTERM 무시(창 유지)'));
process.on('SIGINT', () => console.log('SIGINT 무시(창 유지)'));

const 프레임 = () => pg.frames().find((x) => /PostWriteForm|postwrite/i.test(x.url())) || pg.mainFrame();
const { execFileSync } = await import('node:child_process');

let 됨 = 0; const 실패 = [];
for (const x of 할것) {
  console.log(`\n▶ ${x.id} ${x.제목.slice(0, 30)}`);
  try {
    await pg.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=${blogId}&Redirect=Update&logNo=${x.id}`,
      { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(13000);

    for (let i = 0; i < 5; i += 1) {
      const c = await 프레임().evaluate(() => {
        const b = [...document.querySelectorAll('button,a')]
          .find((e) => /^(취소|닫기)$/.test((e.innerText || '').trim()) && e.offsetParent);
        if (!b) return false; b.click(); return true;
      }).catch(() => false);
      if (!c) break;
      await pg.waitForTimeout(2000);
    }
    await 프레임().evaluate(() => {
      document.querySelectorAll('.se-popup-dim, [class*="popup-dim"]').forEach((e) => (e.style.display = 'none'));
    }).catch(() => {});
    await pg.waitForTimeout(1500);
    const f = 프레임();

    const 전 = await f.evaluate(() => ({
      그림: document.querySelectorAll('.se-component.se-image, .se-section-image').length,
      글자: (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '').length,
    }));
    if (!전.그림) { 실패.push([x.id, '그림 없음']); console.log('  ✗ 그림이 없습니다'); continue; }

    const 자리 = await f.evaluate(() => {
      const g = document.querySelector('.se-component.se-image, .se-section-image');
      g.scrollIntoView({ block: 'center' });
      const r = g.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    await pg.waitForTimeout(1200);
    await pg.mouse.click(자리.x, 자리.y);
    await pg.waitForTimeout(900);
    await pg.keyboard.press('Delete');
    await pg.waitForTimeout(1500);
    const 지움 = await f.evaluate(() =>
      document.querySelectorAll('.se-component.se-image, .se-section-image').length);
    if (지움 >= 전.그림) { await pg.keyboard.press('Backspace'); await pg.waitForTimeout(1500); }
    const 지움2 = await f.evaluate(() =>
      document.querySelectorAll('.se-component.se-image, .se-section-image').length);
    if (지움2 >= 전.그림) { 실패.push([x.id, '옛 표지를 못 지움']); console.log('  ✗ 옛 표지를 못 지웠습니다'); continue; }

    execFileSync('osascript', ['-e',
      `set the clipboard to (read (POSIX file "${path.resolve(x.cover).replace(/"/g, '\\"')}") as «class PNGf»)`]);
    await pg.keyboard.press('Meta+v');
    await pg.waitForTimeout(8000);

    const 후 = await f.evaluate(() => ({
      그림: document.querySelectorAll('.se-component.se-image, .se-section-image').length,
      글자: (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '').length,
    }));
    if (후.그림 !== 전.그림 || 후.글자 < 전.글자 * 0.9) {
      실패.push([x.id, `그림 ${전.그림}→${후.그림} · 글자 ${전.글자}→${후.글자}`]);
      console.log(`  ✗ 이상합니다 — 발행하지 않습니다`);
      continue;
    }

    // **대표 이미지**를 첫 그림으로 옮긴다. 이걸 빼면 썸네일이 안 바뀐다.
    const 대표 = await f.evaluate(() => {
      const g = document.querySelector('.se-component.se-image, .se-section-image');
      g.scrollIntoView({ block: 'center' });
      const b = g.querySelector('button.se-set-rep-image-button');
      if (!b) return '대표 단추 없음';
      if (/se-is-selected/.test(b.className)) return '이미 대표';
      b.click(); return '대표로 지정';
    }).catch(() => '대표 실패');
    await pg.waitForTimeout(1500);

    const 누르기 = async (area, t = 20000) => {
      const b = f.locator(`button[data-click-area="${area}"]`).first();
      await b.waitFor({ state: 'visible', timeout: t });
      await b.click({ timeout: 8000 });
    };
    await 누르기('tpb.publish');
    await pg.waitForTimeout(2000);
    try { await 누르기('tpb*i.publish', 15000); }
    catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
    for (let i = 0; i < 20; i += 1) {
      await pg.waitForTimeout(1500);
      if (!/PostWriteForm|postwrite/i.test(pg.url())) break;
    }
    if (/PostWriteForm|postwrite/i.test(pg.url())) { 실패.push([x.id, '발행 확인 안 됨']); console.log('  ✗ 발행 확인이 안 됩니다'); continue; }
    됨 += 1;
    console.log(`  ✓ 바꿨습니다 (${대표})`);
  } catch (e) {
    실패.push([x.id, String(e.message).split('\n')[0].slice(0, 60)]);
    console.log(`  ✗ ${String(e.message).split('\n')[0].slice(0, 70)}`);
  }
}

console.log(`\n  ${됨}편 바꿨습니다. 실패 ${실패.length}편`);
실패.forEach(([id, 왜]) => console.log(`   ✗ ${id} ${왜}`));
console.log('\n  창은 그대로 둡니다. 다 쓰셨으면 직접 닫으세요.');
await new Promise(() => {});
