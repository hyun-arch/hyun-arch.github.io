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
await pg.waitForTimeout(8000);
const F = pg.mainFrame();

const tab = await F.evaluate(() => {
  const el = [...document.querySelectorAll('a,button,li,span')].find((e) => (e.innerText || '').trim() === '직접등록' && e.offsetParent !== null);
  if (!el) return '탭 없음';
  el.click();
  return '직접등록 눌렀음';
});
P(tab);
await pg.waitForTimeout(2500);

const now = await F.evaluate(() => ({
  files: [...document.querySelectorAll('input[type=file]')].filter((i) => i.offsetParent !== null || true).length,
  btns: [...new Set([...document.querySelectorAll('a,button')].filter((e) => e.offsetParent !== null && /등록|찾기|파일|적용|이미지/.test(e.innerText || '')).map((e) => (e.innerText || '').trim()))].slice(0, 12),
}));
P('파일칸 ' + now.files + ' · 버튼 ' + now.btns.join(' | ').slice(0, 160));
await pg.screenshot({ path: '/tmp/title2.png', fullPage: false }).catch(() => {});
await ctx.close().catch(() => {});
