import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const src = await pg.evaluate(() => ({
  createUser: String(window.category.createNode_user).slice(0, 700),
  createNew: String(window.category.createNode_new).slice(0, 500),
  save: String(window.category.save).slice(0, 400),
  newNode: JSON.stringify(window.category.oNewNode).slice(0, 300),
}));
for (const [k, v] of Object.entries(src)) { P('── ' + k + ' ──'); P(v.replace(/\s+/g, ' ')); }
