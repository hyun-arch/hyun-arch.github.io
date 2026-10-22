import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3000);
const r = await pg.evaluate(() => {
  const keys = []; for (const k in window.tree) keys.push(k + (typeof window.tree[k] === 'function' ? '()' : ''));
  return { keys: keys.join(' '), sel: String(window.tree.select || window.tree.setSelectedNode || '(없음)').slice(0, 200) };
});
P('tree 멤버:', r.keys.slice(0, 900));
P('select 소스:', r.sel.replace(/\s+/g, ' '));
