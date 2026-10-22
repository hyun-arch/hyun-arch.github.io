import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(9000);
await pg.locator('.btn_submit._showConfirmLayer').first().click({ timeout: 10000 }).catch((e) => P('적용 실패 ' + e.message.slice(0, 40)));
await pg.waitForTimeout(3000);
const r = await pg.evaluate(() => {
  const vis = [...document.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null && /적용|확인|저장|취소/.test((e.innerText || '').trim()));
  return vis.map((e) => ({ t: (e.innerText || '').trim().slice(0, 8), c: (e.className || '').toString().slice(0, 48) }));
});
P('지금 보이는 버튼: ' + JSON.stringify(r).slice(0, 500));
const ctrl = await pg.evaluate(() => {
  const k = []; for (const x in window.RemoconController) k.push(x);
  return k.filter((x) => /sav|appl|submit|update/i.test(x)).join(' , ') || k.slice(0, 20).join(' ');
});
P('컨트롤러: ' + ctrl.slice(0, 300));
await ctx.close().catch(() => {});
