import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/타이틀.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/remocon|Remocon|title/i.test(r.url()) && r.request().method() === 'POST') P('POST ' + r.status() + ' ' + r.url().slice(0, 80)); });
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
const F = pg.mainFrame();
await F.evaluate(() => { const e = [...document.querySelectorAll('a')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null); if (e) e.click(); });
await pg.waitForTimeout(1500);
await F.locator('#titleInputFile').setInputFiles(IMG);
await pg.waitForTimeout(8000);
const st = await F.evaluate(() => {
  const panel = document.getElementById('content_menu1');
  const imgs = panel ? [...panel.querySelectorAll('img')].map((i) => i.src).filter((s) => !/sp_|blank/.test(s)).slice(0, 3) : [];
  const applies = [...document.querySelectorAll('a,button')].filter((e) => (e.innerText || '').trim() === '적용')
    .map((e) => ({ cls: (e.className || '').toString().slice(0, 40), vis: e.offsetParent !== null, id: e.id }));
  return { imgs, applies };
});
P('패널 이미지: ' + (st.imgs.join(' , ') || '없음').slice(0, 200));
P('적용 버튼들: ' + JSON.stringify(st.applies));
await pg.screenshot({ path: '/tmp/ap.png' }).catch(() => {});
await ctx.close().catch(() => {});
