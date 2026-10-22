// 이미 올라간 글의 카테고리를 바꾼다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const JOBS = [
  ['224447201524', '31 서재'],
  ['224447202257', '12 릴라이'],
  ['224447202521', '11 진단 이야기'],
  ['224447202775', '31 서재'],
];
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await saveCookies(ctx);

for (const [logNo, want] of JOBS) {
  try {
    await pg.goto(`https://blog.naver.com/PostUpdateForm.naver?blogId=ianlove80&logNo=${logNo}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(5000);
    const f = pg.frames().find((fr) => /PostWriteForm|postwrite|PostUpdate/i.test(fr.url())) || pg.mainFrame();
    for (let t = 0; t < 10; t++) {
      const pop = f.locator('.se-popup-alert-confirm').first();
      if (!(await pop.isVisible().catch(() => false))) { await pg.waitForTimeout(600); continue; }
      await pop.locator('button:has-text("취소")').first().click({ force: true }).catch(() => {});
      await pg.waitForTimeout(1000);
    }
    await f.locator('.se-popup-dim').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    await f.locator('button[class*="publish_btn"]:visible').first().click({ timeout: 25000 });
    const confirm = f.locator('button[class*="confirm_btn"]:visible').first();
    await confirm.waitFor({ state: 'visible', timeout: 20000 });

    const opener = f.locator('button[class*="selectbox_button"]:visible').first();
    await opener.click({ timeout: 10000 }).catch(() => {});
    await pg.waitForTimeout(900);
    const item = f.locator('li:visible, label:visible').filter({ hasText: want.split(' ').slice(1).join(' ') }).first();
    if (await item.isVisible().catch(() => false)) { await item.click().catch(() => {}); P(`  ${logNo} → ${want}`); }
    else { P(`  ${logNo} ✗ "${want}" 못 찾음`); await pg.keyboard.press('Escape').catch(() => {}); }
    await pg.waitForTimeout(600);

    await confirm.click({ timeout: 20000 });
    await pg.waitForTimeout(7000);
    P(`  ${logNo} 저장됨 · ${pg.url().slice(0, 60)}`);
  } catch (e) {
    P(`  ${logNo} 실패: ${e.message.slice(0, 70)}`);
    await pg.screenshot({ path: `/tmp/re-${logNo}.png` }).catch(() => {});
  }
}
