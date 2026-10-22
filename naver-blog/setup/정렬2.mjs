import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await pg.evaluate(() => { const s = [...document.querySelectorAll('span._categoryName')][1]; if (s) window.tree.selectNode(s.closest('li')); });
await pg.waitForTimeout(900);
const h = await pg.evaluate(() => {
  const hits = [...document.querySelectorAll('button,a,span,input')]
    .filter((e) => /^(위|아래|맨위|맨아래)$/.test((e.innerText || e.value || '').trim()))
    .map((e) => e.outerHTML.replace(/\s+/g, ' ').slice(0, 150));
  if (hits.length) return hits.join('\n   ');
  const all = document.body.innerHTML;
  const i = all.indexOf('카테고리 정렬');
  return i < 0 ? '정렬 문구 없음' : all.slice(i, i + 600).replace(/\s+/g, ' ');
});
P(h);
await ctx.close().catch(() => {});
