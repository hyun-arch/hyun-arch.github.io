import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/skin/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
const F = pg.frames().find((fr) => /NaverSkin/i.test(fr.url())) || pg.mainFrame();
const h = await F.evaluate(() => {
  const r = document.getElementById('list_skin8');
  const li = r ? r.closest('li') : null;
  const btn = [...document.querySelectorAll('a,button')].find((e) => (e.innerText || '').trim() === '스킨 적용');
  return { li: li ? li.outerHTML.replace(/\s+/g, ' ').slice(0, 600) : '없음', btn: btn ? btn.outerHTML.replace(/\s+/g, ' ').slice(0, 200) : '없음' };
});
P('항목: ' + h.li);
P('버튼: ' + h.btn);
await ctx.close().catch(() => {});
