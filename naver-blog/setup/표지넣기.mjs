// 글 맨 앞에 표지 이미지를 넣고 다시 발행한다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = (...a) => console.log('  ' + a.join(' '));
const JOBS = ['224447201524', '224447202775', '224447202521'];
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 60)); await d.accept().catch(() => {}); });
await saveCookies(ctx);
let ok = 0;
for (const no of JOBS) {
  const img = path.join(HERE, '../assets/표지', `${no}.png`);
  try {
    await pg.goto(`https://blog.naver.com/PostUpdateForm.naver?blogId=ianlove80&logNo=${no}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(5500);
    const f = pg.frames().find((fr) => /PostWriteForm|postwrite|PostUpdate/i.test(fr.url())) || pg.mainFrame();
    for (let t = 0; t < 10; t++) {
      const pop = f.locator('.se-popup-alert-confirm').first();
      if (!(await pop.isVisible().catch(() => false))) { await pg.waitForTimeout(500); continue; }
      await pop.locator('button:has-text("취소")').first().click({ force: true }).catch(() => {});
      await pg.waitForTimeout(900);
    }
    await f.locator('.se-popup-dim').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // 본문 맨 앞에 커서를 두고 사진을 넣는다
    const first = f.locator('.se-component.se-text .se-text-paragraph').nth(1);
    await first.click({ timeout: 20000 });
    await pg.keyboard.press('Meta+ArrowUp').catch(() => {});
    await pg.waitForTimeout(400);

    const chooser = pg.waitForEvent('filechooser', { timeout: 20000 });
    await f.locator('button[class*="image"], button:has-text("사진")').first().click({ timeout: 15000 });
    (await chooser).setFiles(img);
    await pg.waitForTimeout(7000);
    P(`  ${no} 사진 넣음`);

    await f.locator('button[class*="publish_btn"]:visible').first().click({ timeout: 25000 });
    const confirm = f.locator('button[class*="confirm_btn"]:visible').first();
    await confirm.waitFor({ state: 'visible', timeout: 20000 });
    await confirm.click({ timeout: 20000 });
    await pg.waitForTimeout(7000);
    ok++;
    P(`  ${no} 발행 완료`);
  } catch (e) { P(`  ${no} ✗ ${e.message.slice(0, 55)}`); }
}
P(`끝. ${ok}/${JOBS.length}`);
await ctx.close().catch(() => {});
