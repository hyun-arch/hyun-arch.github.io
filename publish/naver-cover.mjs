#!/usr/bin/env node
// 이미 발행된 글의 **표지 사진(첫 이미지)을 새 것으로 바꾼다.**
//
//   NAVER_HEADLESS=0 node publish/naver-cover.mjs <글ID> <새표지.png> [--보기만]
//
// 왜 (2026-10-23) —
//   앨범형 목록의 썸네일은 **글의 첫 이미지**다. 표지를 다시 만들어도
//   이미 올라간 글은 옛 표지를 그대로 들고 있다.
//   글을 지우고 다시 올리면 주소와 조회가 날아가므로, 첫 이미지만 갈아 끼운다.
//
// 어떻게 —
//   ① 수정 화면을 연다
//   ② 첫 이미지 덩어리를 클릭해 지운다 (Delete)
//   ③ 그 자리에 새 표지를 클립보드로 붙인다
//   ④ 글자 수가 줄지 않았는지 보고 발행한다
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser } from './naver-open.mjs';

const args = process.argv.slice(2);
const id = args.find((a) => /^\d{9,}$/.test(a));
const 새표지 = args.find((a) => /\.(png|jpe?g)$/i.test(a));
const 보기만 = args.includes('--보기만');
const blogId = args.includes('--blog') ? args[args.indexOf('--blog') + 1] : 'ianlove80';
if (!id || !새표지 || !fs.existsSync(새표지)) {
  console.log('쓰는 법: node publish/naver-cover.mjs <글ID> <새표지.png> [--보기만]');
  process.exit(1);
}

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { console.log('  알림:', d.message().slice(0, 50)); await d.accept().catch(() => {}); });

try {
  await pg.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=${blogId}&Redirect=Update&logNo=${id}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(13000);

  const 프레임 = () => pg.frames().find((x) => /PostWriteForm|postwrite/i.test(x.url())) || pg.mainFrame();
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

  const 전 = await f.evaluate(() => {
    const 그림 = [...document.querySelectorAll('.se-component.se-image, .se-section-image')];
    const 글 = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
    return { 그림수: 그림.length, 글자: 글.length };
  });
  console.log(`  지금 — 그림 ${전.그림수}장 · 본문 ${전.글자}자`);
  if (!전.그림수) { console.log('  그림이 없습니다. 바꿀 표지가 없습니다.'); await ctx.close().catch(() => {}); process.exit(1); }

  if (보기만) { console.log('  보기만 했습니다.'); await ctx.close().catch(() => {}); process.exit(0); }

  // ① 첫 그림으로 가서 고른다
  const 자리 = await f.evaluate(() => {
    const g = document.querySelector('.se-component.se-image, .se-section-image');
    if (!g) return null;
    g.scrollIntoView({ block: 'center' });
    const r = g.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await pg.waitForTimeout(1200);
  await pg.mouse.click(자리.x, 자리.y);
  await pg.waitForTimeout(900);

  // ② 지운다
  await pg.keyboard.press('Delete');
  await pg.waitForTimeout(1500);
  const 지운뒤 = await f.evaluate(() =>
    document.querySelectorAll('.se-component.se-image, .se-section-image').length);
  if (지운뒤 >= 전.그림수) {
    await pg.keyboard.press('Backspace');
    await pg.waitForTimeout(1500);
  }
  const 지운뒤2 = await f.evaluate(() =>
    document.querySelectorAll('.se-component.se-image, .se-section-image').length);
  console.log(`  옛 표지 지움: ${전.그림수} → ${지운뒤2}장`);
  if (지운뒤2 >= 전.그림수) throw new Error('옛 표지를 못 지웠습니다 — 발행하지 않고 멈춥니다');

  // ③ 새 표지를 그 자리에 붙인다 (클립보드)
  const { execFileSync } = await import('node:child_process');
  execFileSync('osascript', ['-e',
    `set the clipboard to (read (POSIX file "${path.resolve(새표지).replace(/"/g, '\\"')}") as «class PNGf»)`]);
  await pg.keyboard.press('Meta+v');
  await pg.waitForTimeout(8000);

  const 후 = await f.evaluate(() => {
    const 그림 = [...document.querySelectorAll('.se-component.se-image, .se-section-image')];
    const 글 = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
    return { 그림수: 그림.length, 글자: 글.length };
  });
  console.log(`  바꾼 뒤 — 그림 ${후.그림수}장 · 본문 ${후.글자}자`);
  if (후.그림수 !== 전.그림수) throw new Error(`그림 수가 달라졌습니다(${전.그림수}→${후.그림수}) — 발행하지 않고 멈춥니다`);
  if (후.글자 < 전.글자 * 0.9) throw new Error(`본문이 줄었습니다(${전.글자}→${후.글자}자) — 발행하지 않고 멈춥니다`);

  // ④ 첫 이미지를 **대표 이미지**로 지정한다
  // 네이버는 이미지마다 「대표」 표시를 따로 들고 있다. 첫 이미지를 바꿔도
  // 대표가 옛 이미지에 걸려 있으면 **앨범형 썸네일은 그대로다.** (2026-10-23 실측)
  // 단추: button.se-set-rep-image-button (지정돼 있으면 se-is-selected 가 붙는다)
  const 대표 = await f.evaluate(() => {
    const g = document.querySelector('.se-component.se-image, .se-section-image');
    if (!g) return '첫 이미지 없음';
    g.scrollIntoView({ block: 'center' });
    const b = g.querySelector('button.se-set-rep-image-button');
    if (!b) return '대표 단추 없음';
    if (/se-is-selected/.test(b.className)) return '이미 대표';
    b.click();
    return '대표로 지정함';
  }).catch((e) => '✗ ' + String(e.message).slice(0, 60));
  await pg.waitForTimeout(1500);
  console.log('  대표 이미지: ' + 대표);

  // ⑤ 발행
  const 누르기 = async (area, timeout = 20000) => {
    const b = f.locator(`button[data-click-area="${area}"]`).first();
    await b.waitFor({ state: 'visible', timeout });
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
  if (/PostWriteForm|postwrite/i.test(pg.url())) throw new Error('발행 확인이 안 됩니다');
  console.log('  ✓ 표지를 바꿔 발행했습니다 →', pg.url().slice(0, 90));
} finally {
  await ctx.close().catch(() => {});
}
