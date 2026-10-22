import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3000);
const rows = await pg.evaluate(() => {
  const j = JSON.parse(window.category.getJson());
  const list = j.list || j;
  return list.map((c) => ({ no: c.categoryNo, p: c.parentCategoryNo, n: c.categoryName, cnt: c.postCount }));
});
P('총 ' + rows.length + '개');
for (const r of rows) P(`   ${String(r.no).padStart(4)}  부모${String(r.p).padStart(4)}  ${r.n}${r.cnt ? ' (' + r.cnt + ')' : ''}`);
await ctx.close().catch(() => {});
