import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/config/bloginfo', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('textarea').length).catch(() => 0);
  if (!n) continue;
  const r = await fr.evaluate(() => ({
    intro: (document.querySelector('textarea') || {}).value || '',
    files: document.querySelectorAll('input[type=file]').length,
    btns: [...document.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null && /등록|삭제/.test(e.innerText || '')).map((e) => (e.innerText || '').trim()),
  }));
  P('소개글: ' + r.intro.slice(0, 60).replace(/\s+/g, ' '));
  P('파일칸 ' + r.files + '개 · 버튼 ' + r.btns.join(',').slice(0, 60));
  break;
}
await ctx.close().catch(() => {});
