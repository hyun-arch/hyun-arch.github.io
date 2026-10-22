import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
const f = pg.frames().find((fr) => /ianlove80/.test(fr.url()) && fr !== pg.mainFrame()) || pg.mainFrame();
const r = await f.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => /^카테고리/.test((e.innerText || '').trim()) && e.children.length < 30);
  const box = el ? el.getBoundingClientRect() : null;
  const list = [...document.querySelectorAll('*')].find((e) => /전체보기 \d+개의 글/.test((e.innerText || '').trim().slice(0, 20)));
  const lb = list ? list.getBoundingClientRect() : null;
  return {
    카테고리: box ? Math.round(box.top + window.scrollY) + 'px 지점, 폭 ' + Math.round(box.width) : '못 찾음',
    목록: lb ? Math.round(lb.top + window.scrollY) + 'px 지점' : '못 찾음',
    문서높이: document.body.scrollHeight,
  };
});
P(JSON.stringify(r));
await pg.screenshot({ path: '/tmp/full.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
