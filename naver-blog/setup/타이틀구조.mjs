import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
const F = pg.mainFrame();
await F.evaluate(() => { const e = [...document.querySelectorAll('a,button,li,span')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null); if (e) e.click(); });
await pg.waitForTimeout(2500);
const h = await F.evaluate(() => {
  const tab = [...document.querySelectorAll('a,button,li,span')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null);
  if (!tab) return { panel: '직접등록 못 찾음' };
  let p = tab;
  for (let i = 0; i < 6 && p.parentElement; i++) p = p.parentElement;
  const files = [...p.querySelectorAll('input[type=file]')].map((i) => i.outerHTML.replace(/\s+/g, ' ').slice(0, 140));
  const btns = [...p.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null)
    .map((e) => ((e.innerText || '').trim().slice(0, 10) + '[' + (e.className || '').toString().slice(0, 22) + ']'));
  return { panel: p.className || p.id, files, btns: btns.slice(0, 20), html: p.outerHTML.replace(/\s+/g, ' ').slice(0, 700) };
});
P('패널: ' + h.panel);
P('파일칸: ' + JSON.stringify(h.files));
P('버튼: ' + (h.btns || []).join(' | ').slice(0, 260));
P('HTML: ' + (h.html || '').slice(0, 600));
await ctx.close().catch(() => {});
