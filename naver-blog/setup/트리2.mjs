import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
await saveCookies(ctx);
P('주소:', pg.url());
const items = await pg.evaluate(() => [...document.querySelectorAll('a,button,input[type=button],span,li')]
  .filter((e) => e.offsetParent !== null)
  .map((e) => ({ tag: e.tagName, t: (e.innerText || e.value || '').trim().slice(0, 18), id: e.id, cls: (e.className || '').toString().slice(0, 28) }))
  .filter((x) => x.t));
P('항목 ' + items.length + '개');
for (const i of items.slice(0, 45)) P('   ', i.tag, JSON.stringify(i.t), i.id ? '#' + i.id : '', i.cls);
await pg.screenshot({ path: '/tmp/tree2.png', fullPage: true }).catch(() => {});
