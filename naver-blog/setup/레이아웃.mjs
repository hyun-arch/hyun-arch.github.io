import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
for (const u of [
  'https://admin.blog.naver.com/ianlove80/layout',
  'https://admin.blog.naver.com/LayoutSetting.naver?blogId=ianlove80',
  'https://admin.blog.naver.com/ianlove80/skin/layout',
]) {
  await pg.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await pg.waitForTimeout(3500);
  const bad = await pg.locator('a:has-text("이전 화면으로")').first().isVisible().catch(() => false);
  P((bad ? '✗' : '○') + '  ' + u.replace('https://admin.blog.naver.com', '') + '  → ' + pg.url().slice(-40));
  if (!bad) {
    const r = await pg.evaluate(() => ({
      radios: [...document.querySelectorAll('input[type=radio]')].map((i) => ({ id: i.id, v: i.value, on: i.checked })).slice(0, 16),
      btns: [...new Set([...document.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null && /적용|확인|저장/.test(e.innerText || '')).map((e) => (e.innerText || '').trim() + '[' + (e.className || '').toString().slice(0, 26) + ']'))].slice(0, 8),
    }));
    P('  라디오: ' + JSON.stringify(r.radios).slice(0, 420));
    P('  버튼: ' + r.btns.join(' | ').slice(0, 200));
    break;
  }
}
await ctx.close().catch(() => {});
