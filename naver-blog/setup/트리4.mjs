import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const info = await pg.evaluate(() => {
  const out = { keys: [], addBtns: [] };
  try {
    const c = window.category;
    for (const k in c) out.keys.push(k + (typeof c[k] === 'function' ? '()' : ''));
  } catch (e) { out.err = String(e); }
  out.addBtns = [...document.querySelectorAll('a,button')]
    .map((e) => ({ t: (e.innerText || '').trim().slice(0, 20), on: (e.getAttribute('onclick') || '').slice(0, 90), id: e.id }))
    .filter((x) => /add|Node|category\./i.test(x.on) || /추가/.test(x.t));
  return out;
});
P('category 멤버:', (info.keys || []).join(' ').slice(0, 700));
if (info.err) P('오류:', info.err);
P('추가 버튼 후보:');
for (const b of info.addBtns.slice(0, 10)) P('   ', JSON.stringify(b.t), b.id ? '#' + b.id : '', b.on);
