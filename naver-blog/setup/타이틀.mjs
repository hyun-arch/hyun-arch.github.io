import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/타이틀.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(7000);
P('주소: ' + pg.url().slice(0, 80));
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('input[type=file],input[type=radio],a,button').length).catch(() => 0);
  if (n > 5) {
    const r = await fr.evaluate(() => ({
      files: document.querySelectorAll('input[type=file]').length,
      btns: [...new Set([...document.querySelectorAll('a,button,input[type=submit]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || '').trim()).filter((t) => t && t.length < 16))].slice(0, 30),
      checks: [...document.querySelectorAll('input[type=checkbox],input[type=radio]')].map((i) => (i.id || i.name) + ':' + i.checked).slice(0, 12),
    }));
    P('프레임 ' + (fr.url() || '메인').slice(-40) + ' · 파일 ' + r.files);
    P('  버튼: ' + r.btns.join(' | ').slice(0, 260));
    P('  선택: ' + r.checks.join(' , ').slice(0, 200));
  }
}
await pg.screenshot({ path: '/tmp/title.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
