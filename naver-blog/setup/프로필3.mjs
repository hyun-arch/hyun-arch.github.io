import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, '../assets/프로필.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
await pg.goto('https://admin.blog.naver.com/ianlove80/config/bloginfo', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
const F = pg.frames().find((fr) => /AdminUserBasic/i.test(fr.url())) || pg.mainFrame();

const before = await F.evaluate(() => {
  const i = [...document.querySelectorAll('img')].find((x) => /pfthumb|profile/i.test(x.src));
  return i ? i.src : '없음';
});
P('전 프로필: ' + before.slice(-50));

const [popup] = await Promise.all([
  pg.waitForEvent('popup', { timeout: 15000 }),
  F.locator('a:has-text("등록"), button:has-text("등록")').first().click({ timeout: 10000 }),
]);
await popup.waitForLoadState('domcontentloaded').catch(() => {});
await popup.waitForTimeout(2500);
P('팝업 열림');
await popup.locator('input[type=file]').first().setInputFiles(IMG);
await popup.waitForTimeout(2000);
// 팝업의 첨부 버튼을 누른다 (폼 직접 전송은 토큰이 비어 실패한다)
await popup.locator('#submitBtn').click({ timeout: 10000 }).catch((e) => P('submitBtn 실패 ' + e.message.slice(0, 40)));
await popup.waitForTimeout(7000).catch(() => {});
P('팝업 업로드 보냄');
await popup.close().catch(() => {});
await pg.waitForTimeout(4000);

const mid = await F.evaluate(() => {
  const i = [...document.querySelectorAll('img')].find((x) => /pfthumb|profile/i.test(x.src));
  return i ? i.src : '없음';
});
P('본 화면 미리보기: ' + mid.slice(-50));

await F.locator('a:has-text("확인"), input[value="확인"], button:has-text("확인")').last().click({ timeout: 15000 }).catch((e) => P('확인 실패 ' + e.message.slice(0, 40)));
await pg.waitForTimeout(8000);
P('저장 완료 · ' + pg.url().slice(0, 70));
await ctx.close().catch(() => {});
