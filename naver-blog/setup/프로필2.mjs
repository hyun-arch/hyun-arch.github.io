import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/프로필.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/Profile/i.test(r.url()) && r.request().method() === 'POST') P('업로드 응답 ' + r.status()); });
await pg.goto('https://blog.naver.com/AddProfileImageView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3000);
const shape = await pg.evaluate(() => {
  const f = document.forms[0];
  const i = document.querySelector('input[type=file]');
  return { forms: document.forms.length, action: f ? f.action : '', method: f ? f.method : '', fileName: i ? (i.name || i.id) : '', onchange: i ? (i.getAttribute('onchange') || '') : '' };
});
P('폼: ' + JSON.stringify(shape));
await pg.locator('input[type=file]').first().setInputFiles(IMG);
await pg.waitForTimeout(2500);
const after = await pg.evaluate(() => {
  const i = document.querySelector('input[type=file]');
  i.dispatchEvent(new Event('change', { bubbles: true }));
  const f = document.forms[0];
  if (f) { try { f.submit(); return '폼 전송'; } catch (e) { return '전송 오류 ' + e; } }
  return '폼 없음';
});
P(after);
await pg.waitForTimeout(6000);
P('지금: ' + pg.url().slice(0, 80));
await pg.screenshot({ path: '/tmp/pf.png' }).catch(() => {});
await ctx.close().catch(() => {});
