import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const html = await pg.content();
const hits = [...html.matchAll(/<(a|button|input)[^>]*>(?:[^<]{0,40})/gi)]
  .map((m) => m[0].replace(/\s+/g, ' '))
  .filter((s) => /추가|삭제|구분선|add|del/i.test(s));
P('추가·삭제 관련 요소 ' + hits.length + '개');
for (const h of hits.slice(0, 15)) P('   ', h.slice(0, 160));
const inputs = [...html.matchAll(/<input[^>]*type="?text"?[^>]*>/gi)].map((m) => m[0].replace(/\s+/g, ' '));
P('텍스트 입력칸 ' + inputs.length + '개');
for (const i of inputs.slice(0, 6)) P('   ', i.slice(0, 150));
