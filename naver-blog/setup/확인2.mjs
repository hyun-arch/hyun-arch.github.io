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

const cur = () => f.evaluate(() => {
  const b = [...document.querySelectorAll('button[class*="selectbox_button"]')].find((e) => e.offsetParent !== null);
  const checked = [...document.querySelectorAll('input[type=radio]:checked, input[type=checkbox]:checked')].map((i) => i.value + '/' + (i.id || ''));
  return { 버튼: b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : '없음', 체크: checked.slice(0, 5) };
});
P('열기 전: ' + JSON.stringify(await cur()));
await f.locator('button[class*="selectbox_button"]:visible').first().click({ timeout: 10000 }).catch(() => {});
await pg.waitForTimeout(1200);
const res = await f.evaluate(() => {
  const norm = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
  for (const el of document.querySelectorAll('li,label,span,a')) {
    if (el.offsetParent === null) continue;
    if (norm(el) === '하위 카테고리 21 유럽' || norm(el) === '21 유럽') {
      const r = el.querySelector('input[type=radio]') || el.closest('li')?.querySelector('input[type=radio]');
      el.click();
      return { 누름: norm(el), 태그: el.tagName, 라디오: r ? (r.id || r.value) : '없음' };
    }
  }
  return null;
});
P('누른 항목: ' + JSON.stringify(res));
await pg.waitForTimeout(1200);
P('누른 뒤: ' + JSON.stringify(await cur()));
await pg.screenshot({ path: '/tmp/sel.png' }).catch(() => {});
