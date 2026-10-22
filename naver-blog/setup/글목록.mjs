import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/PostList.naver?blogId=ianlove80&categoryNo=0&from=postList', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const f = pg.frames().find((fr) => /PostList|mainFrame/i.test(fr.url())) || pg.mainFrame();
P('프레임: ' + f.url().slice(0, 90));
const r = await f.evaluate(() => ({
  btns: [...new Set([...document.querySelectorAll('a,button,input[type=button]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || '').trim()).filter((t) => t && t.length < 14))],
  boxes: document.querySelectorAll('input[type=checkbox]').length,
  titles: [...document.querySelectorAll('a')].map((a) => (a.innerText || '').trim()).filter((t) => t.length > 8 && t.length < 50).slice(0, 10),
}));
P('체크박스 ' + r.boxes + '개');
P('버튼: ' + r.btns.join(' | ').slice(0, 400));
P('글 제목 샘플: ' + r.titles.join(' · ').slice(0, 300));
await pg.screenshot({ path: '/tmp/list.png', fullPage: true }).catch(() => {});
