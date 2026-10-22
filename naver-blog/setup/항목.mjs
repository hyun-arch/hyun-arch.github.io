import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/PostUpdateForm.naver?blogId=ianlove80&logNo=224179139313', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(5000);
const f = pg.frames().find((fr) => /PostWriteForm|postwrite|PostUpdate/i.test(fr.url())) || pg.mainFrame();
for (let t = 0; t < 10; t++) {
  const pop = f.locator('.se-popup-alert-confirm').first();
  if (!(await pop.isVisible().catch(() => false))) { await pg.waitForTimeout(500); continue; }
  await pop.locator('button:has-text("취소")').first().click({ force: true }).catch(() => {});
  await pg.waitForTimeout(900);
}
await f.locator('.se-popup-dim').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
await f.locator('button[class*="publish_btn"]:visible').first().click({ timeout: 25000 });
await f.locator('button[class*="confirm_btn"]:visible').first().waitFor({ state: 'visible', timeout: 20000 });
await f.locator('button[class*="selectbox_button"]:visible').first().click({ timeout: 10000 }).catch(() => {});
await pg.waitForTimeout(1200);
const items = await f.evaluate(() => [...document.querySelectorAll('li,label')]
  .filter((e) => e.offsetParent !== null)
  .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim())
  .filter((t) => t && t.length < 30));
P('항목 ' + items.length + '개:');
for (const i of items.slice(0, 30)) P('   ' + JSON.stringify(i));
await pg.screenshot({ path: '/tmp/items.png' }).catch(() => {});
