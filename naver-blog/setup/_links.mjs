import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/config/topmenu', { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
await pg.waitForTimeout(3000);
const links = await pg.evaluate(() => [...document.querySelectorAll('a[href]')]
  .map(a => ({ t: (a.innerText||'').trim().replace(/\s+/g,' '), h: a.getAttribute('href') }))
  .filter(x => /config|category|Category|manage/i.test(x.h) || /카테고리|메뉴|관리/.test(x.t)));
for (const l of links.slice(0, 40)) console.log('  ' + (l.t||'(무)').padEnd(22) + l.h);
await pg.screenshot({ path: '/tmp/topmenu.png', fullPage: true }).catch(()=>{});
