import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const t = await pg.evaluate(() => [...document.querySelectorAll('li.tree-node, li[class*="tree"]')]
  .map((li) => { const s = li.querySelector('span._categoryName'); return s ? (s.textContent || '').trim() : null; }).filter(Boolean));
console.log('  저장된 트리: ' + t.join(' / '));
