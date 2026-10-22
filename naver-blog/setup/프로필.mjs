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

// 첫 번째 "등록" = 블로그 프로필 이미지
const reg = F.locator('a:has-text("등록"), button:has-text("등록")').first();
const [popup] = await Promise.all([
  pg.waitForEvent('popup', { timeout: 12000 }).catch(() => null),
  reg.click({ timeout: 10000 }).catch((e) => P('등록 클릭 실패: ' + e.message.slice(0, 40))),
]);
await pg.waitForTimeout(3000);

const target = popup || pg;
if (popup) P('팝업: ' + popup.url().slice(0, 70));
const fi = target.locator('input[type=file]').first();
if (await fi.count()) {
  await fi.setInputFiles(IMG);
  P('파일 넣음');
  await target.waitForTimeout(5000);
  for (const t of ['확인', '등록', '적용', '저장']) {
    const b = target.locator(`a:has-text("${t}"), button:has-text("${t}"), input[value="${t}"]`).last();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); P(t + ' 눌렀습니다'); await target.waitForTimeout(3000); break; }
  }
} else {
  P('파일 칸을 못 찾음');
  const btns = await target.evaluate(() => [...document.querySelectorAll('a,button,input')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || e.type || '').trim()).filter(Boolean).slice(0, 25));
  P('보이는 것: ' + btns.join(' | ').slice(0, 250));
}
await pg.screenshot({ path: '/tmp/prof.png', fullPage: true }).catch(() => {});
// 본문 저장
const ok = F.locator('a:has-text("확인"), input[value="확인"]').last();
await ok.click({ timeout: 10000 }).catch(() => {});
await pg.waitForTimeout(6000);
P('완료 · ' + pg.url());
await ctx.close().catch(() => {});
