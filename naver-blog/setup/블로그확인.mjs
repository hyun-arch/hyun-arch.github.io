import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
const f = pg.frames().find((fr) => /PostList|mainFrame|blog\.naver\.com\/ianlove80/.test(fr.url())) || pg.mainFrame();
const r = await f.evaluate(() => {
  const txt = document.body.innerText;
  const imgs = [...document.querySelectorAll('img')].map((i) => i.src).filter((s) => /pfthumb|profile/i.test(s)).slice(0, 2);
  const intro = (txt.match(/진단과 여행[^\n]*/) || txt.match(/유럽을 직접[^\n]*/) || ['(소개글 못 찾음)'])[0];
  return { imgs, intro: intro.slice(0, 60) };
});
P('프로필 이미지: ' + (r.imgs.join(' , ') || '없음').slice(0, 160));
P('소개글: ' + r.intro);
await pg.screenshot({ path: '/tmp/blog-now.png' }).catch(() => {});
await ctx.close().catch(() => {});
