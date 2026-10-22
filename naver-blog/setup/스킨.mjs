import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/config/bloginfo', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(5000);
const links = await pg.evaluate(() => [...document.querySelectorAll('a[href]')]
  .map((a) => ({ t: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 16), h: a.getAttribute('href') || '' }))
  .filter((x) => x.t && /skin|design|layout|꾸미기|스킨|레이아웃|위젯/i.test(x.t + x.h)));
for (const l of links.slice(0, 14)) P(l.t.padEnd(14) + l.h.replace(/^https?:\/\/[^/]+/, ''));
await ctx.close().catch(() => {});
