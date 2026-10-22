// 타이틀 배너 — 화면에 창을 띄우지 않고 처리한다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/타이틀.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 80)); await d.accept().catch(() => {}); });
pg.on('request', (r) => { if (r.method() === 'POST' && !/nlog|jackpot|scv-blog|siape|lcs/.test(r.url())) P('POST → ' + r.url().slice(0, 95)); });
pg.on('response', (r) => { if (r.request().method() === 'POST' && !/nlog|jackpot|scv-blog|siape|lcs/.test(r.url())) P('   ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(9000);
const F = pg.mainFrame();
await F.evaluate(() => { const e = [...document.querySelectorAll('a')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null); if (e) e.click(); });
await pg.waitForTimeout(1500);
await F.locator('#titleInputFile').setInputFiles(IMG);
await pg.waitForTimeout(9000);
await F.evaluate(() => { const cb = document.getElementById('chk_title_display'); if (cb && cb.checked) cb.click(); });
await F.locator('.btn_submit._showConfirmLayer').first().click({ timeout: 10000 }).catch(() => {});
await pg.waitForTimeout(2500);
// 레이어의 확인 버튼은 .button_next._submit 이다 (.btn_submit 은 방금 누른 적용 버튼이라 다시 누르면 안 된다)
await F.locator('.button_next._submit').first().click({ timeout: 10000 }).catch((e) => P('확인 실패 ' + e.message.slice(0, 40)));
P('레이어 확인 눌렀음');
await pg.waitForTimeout(10000);
P('끝');
await ctx.close().catch(() => {});
