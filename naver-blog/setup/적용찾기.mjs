import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(9000);
const r = await pg.evaluate(() => ({
  forms: [...document.forms].map((f) => (f.name || f.id) + ' → ' + f.action + ' [' + f.method + ']'),
  btn: (() => { const e = document.querySelector('.btn_submit._showConfirmLayer'); return e ? e.outerHTML.replace(/\s+/g, ' ').slice(0, 220) : '없음'; })(),
  layer: (() => { const e = [...document.querySelectorAll('[class*="confirm"],[class*="layer"]')].map((x) => (x.className || '').toString().slice(0, 36)); return [...new Set(e)].slice(0, 10); })(),
  globals: Object.keys(window).filter((k) => /remocon|Remocon/.test(k)).slice(0, 10),
}));
P('폼: ' + r.forms.join(' | ').slice(0, 400));
P('적용 버튼: ' + r.btn);
P('레이어 클래스: ' + r.layer.join(' , '));
P('전역: ' + r.globals.join(' , '));
await ctx.close().catch(() => {});
