#!/usr/bin/env node
// 스레드 글에 답글을 단다.
//   node publish/threads-reply.mjs <글주소> "<답글>"
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [url, text] = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-sns'),
  { headless: false, viewport: null, locale: 'ko-KR' });
const pg = ctx.pages()[0] || await ctx.newPage();
try {
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(9000);

  // 글 아래에 답글 칸이 이미 하나 떠 있다 — 따로 열 필요가 없다 (2026-10-22 실측)
  const box = pg.locator('div[contenteditable="true"]').last();
  await box.click({ timeout: 20000 });
  const 이미 = (await box.innerText().catch(() => '')).trim();
  if (!이미) await pg.keyboard.insertText(text);
  else console.log('  (이미 입력돼 있습니다 — 그대로 올립니다)');
  await pg.waitForTimeout(2500);
  await pg.screenshot({ path: '/tmp/thr-before.png' });

  // 게시 — 글자 버튼이 아니라 동그란 ↑ 아이콘이다 (2026-10-22 실측)
  let ok = false;
  for (const sel of [
      'div[contenteditable="true"] ~ * svg',
      'svg[aria-label="게시"]', 'svg[aria-label="Post"]',
      'div[role="button"]:has(svg)',
  ]) {
    const el = pg.locator(sel).last();
    if (!(await el.count().catch(() => 0))) continue;
    const t = pg.locator(sel).locator(
      'xpath=ancestor-or-self::*[self::button or @role="button"][1]').last();
    try {
      if (await t.count()) { await t.click({ timeout: 8000 }); ok = true; break; }
      await el.click({ timeout: 8000, force: true }); ok = true; break;
    } catch { /* 다음 후보 */ }
  }
  if (!ok) {
    // 마지막 수단 — 글 상자에서 Cmd+Enter
    await box.click().catch(()=>{});
    await pg.keyboard.press('Meta+Enter').catch(()=>{});
    ok = true;
  }
  console.log('게시 눌림:', ok);
  await pg.waitForTimeout(9000);
  await pg.screenshot({ path: '/tmp/thr-after.png' });
  const 남음 = await pg.locator('div[contenteditable="true"]').count();
  console.log(남음 > 1 ? '△ 창이 남아 있습니다 — 확인 필요' : '✓ 올라간 것으로 보입니다');
} finally { await ctx.close().catch(()=>{}); }
