import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3000);
const html = await pg.content();
for (const m of [...html.matchAll(/<(a|button|input)[^>]*>(?:[^<]{0,12})/gi)].map((x) => x[0].replace(/\s+/g, ' '))) {
  if (/확인|submit|save/i.test(m)) P(m.slice(0, 180));
}
P('── 폼 ──');
P(await pg.evaluate(() => [...document.forms].map((f) => f.name + ' / ' + f.id + ' / ' + f.action).join(' | ')));
