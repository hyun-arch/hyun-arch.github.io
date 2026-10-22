import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/PostList.naver?blogId=ianlove80&categoryNo=1&from=postList', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('a[href]').length).catch(() => 0);
  const hits = await fr.evaluate(() => [...document.querySelectorAll('a[href]')].filter((a) => /\d{9,}/.test(a.href)).length).catch(() => 0);
  P('프레임 ' + (fr.url() || '-').slice(-55) + '  a=' + n + '  글링크=' + hits);
}
const links = await pg.mainFrame().evaluate(() => [...document.querySelectorAll('a[href]')]
  .filter((a) => /\d{9,}/.test(a.href))
  .map((a) => ({ h: a.getAttribute('href'), t: (a.innerText || a.title || (a.closest('li,div,tr') || {}).innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50) })));
for (const l of links) P('   ' + l.h.slice(0, 70) + '   ' + l.t);
await pg.screenshot({ path: '/tmp/cat1.png', fullPage: false }).catch(() => {});
