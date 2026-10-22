import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(2000);
const t = await pg.evaluate(async () => {
  const r = await fetch('https://blog.naver.com/PostTitleListAsync.naver?blogId=ianlove80&viewdate=&currentPage=1&categoryNo=1&parentCategoryNo=&countPerPage=30', { credentials: 'include' });
  return (await r.text()).slice(0, 400);
});
console.log('  응답: ' + t.replace(/\s+/g, ' '));
