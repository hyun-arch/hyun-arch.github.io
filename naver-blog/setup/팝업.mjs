import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/프로필.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/config/bloginfo', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
const F = pg.frames().find((fr) => /AdminUserBasic/i.test(fr.url())) || pg.mainFrame();
const [popup] = await Promise.all([
  pg.waitForEvent('popup', { timeout: 15000 }),
  F.locator('a:has-text("등록")').first().click({ timeout: 10000 }),
]);
await popup.waitForLoadState('domcontentloaded').catch(() => {});
await popup.waitForTimeout(2500);
await popup.locator('input[type=file]').first().setInputFiles(IMG);
await popup.waitForTimeout(2500);
const d = await popup.evaluate(() => ({
  html: document.body.innerHTML.replace(/\s+/g, ' ').slice(0, 900),
  all: [...document.querySelectorAll('a,button,input')].map((e) => (e.tagName + ':' + (e.type || '') + ':' + (e.innerText || e.value || '').trim().slice(0, 10) + ':' + (e.id || e.name || '')).slice(0, 40)),
}));
P('요소: ' + d.all.join(' | ').slice(0, 450));
P('HTML: ' + d.html.slice(0, 500));
await ctx.close().catch(() => {});
