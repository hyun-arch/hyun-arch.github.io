import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const r = await pg.evaluate(() => {
  const keys = []; for (const k in window.category) keys.push(k);
  const add = keys.filter((k) => /add|insert|new|create|append/i.test(k));
  const tb = [...document.querySelectorAll('[class*="btn"], [class*="add"]')]
    .map((e) => ({ t: (e.innerText || '').trim().slice(0, 16), c: (e.className || '').toString().slice(0, 30), on: (e.getAttribute('onclick') || '').slice(0, 70) }))
    .filter((x) => x.t || x.on);
  return { all: keys.length, add, tb: tb.slice(0, 20), tail: keys.slice(-25) };
});
P('멤버 ' + r.all + '개');
P('추가 계열:', r.add.join(' , ') || '없음');
P('뒤쪽 멤버:', r.tail.join(' '));
P('버튼류:');
for (const b of r.tb) P('   ', JSON.stringify(b.t), b.c, b.on);
