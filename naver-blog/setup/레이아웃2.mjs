import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/LayoutSelect.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(5000);
P('주소: ' + pg.url().slice(-50));
const r = await pg.evaluate(() => {
  const items = [...document.querySelectorAll('a,li,label')].filter((e) => /_layout|layout_/i.test((e.className || '').toString() + e.id));
  return items.map((e) => ({ tag: e.tagName, id: e.id, cls: (e.className || '').toString().slice(0, 34), t: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 14), sel: /on|select/.test((e.className || '').toString()) })).slice(0, 20);
});
P(JSON.stringify(r).slice(0, 900));
await pg.screenshot({ path: '/tmp/layout.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
