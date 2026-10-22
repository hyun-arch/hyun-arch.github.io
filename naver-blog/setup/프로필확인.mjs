import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/AddProfileImageView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
const r = await pg.evaluate(() => ({
  btns: [...document.querySelectorAll('a,button,input[type=submit],input[type=button]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || '').trim()).filter(Boolean),
  files: document.querySelectorAll('input[type=file]').length,
  imgs: [...document.querySelectorAll('img')].map((i) => i.src).filter((s) => /profile|blogpfthumb/i.test(s)).slice(0, 3),
}));
P('버튼: ' + r.btns.join(' | ').slice(0, 200));
P('파일칸: ' + r.files);
P('이미지: ' + r.imgs.join(' , ').slice(0, 200));
await pg.screenshot({ path: '/tmp/pp.png' }).catch(() => {});
await ctx.close().catch(() => {});
