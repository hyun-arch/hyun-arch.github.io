import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
const r = await pg.evaluate(() => {
  const j = JSON.parse(window.category.getJson()); const list = j.list || j;
  return list.map((c) => `${c.categoryNo} ${c.categoryName} lv=${c.categoryLevel} parent=${c.parentCategoryNo} order=${c.listOrder} act=${c.actionType}`);
});
for (const x of r) P('  ' + x);

await ctx.close().catch(() => {});
