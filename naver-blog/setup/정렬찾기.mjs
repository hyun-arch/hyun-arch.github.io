import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await pg.evaluate(() => { const s = [...document.querySelectorAll('span._categoryName')][1]; if (s) window.tree.selectNode(s.closest('li')); });
await pg.waitForTimeout(1000);
const r = await pg.evaluate(() => [...document.querySelectorAll('a,button,input[type=button]')]
  .filter((e) => /위|아래|맨/.test((e.innerText || e.value || '').trim()))
  .map((e) => ({ t: (e.innerText || e.value || '').trim().slice(0, 6), id: e.id, cls: (e.className || '').toString().slice(0, 34), dis: e.disabled || /disabled/.test((e.className || '').toString()) })));
P(JSON.stringify(r).slice(0, 600));
const keys = await pg.evaluate(() => { const k = []; for (const x in window.category) k.push(x); return k.filter((x) => /move|order|sort/i.test(x)).join(' , '); });
P('이동 함수: ' + keys);
await ctx.close().catch(() => {});
