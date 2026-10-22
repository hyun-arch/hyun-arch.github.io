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
await F.evaluate(() => { const e = [...document.querySelectorAll('a,button,li,span')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null); if (e) e.click(); });
await pg.waitForTimeout(2500);

// "등록" 을 누르면 이미지 첨부 팝업이 뜬다
const [popup] = await Promise.all([
  pg.waitForEvent('popup', { timeout: 15000 }).catch(() => null),
  F.evaluate(() => { const e = [...document.querySelectorAll('a,button')].find((x) => (x.innerText || '').trim() === '등록' && x.offsetParent !== null); if (e) e.click(); }),
]);
if (popup) {
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  await popup.waitForTimeout(2500);
  P('팝업: ' + popup.url().slice(0, 70));
  await popup.locator('input[type=file]').first().setInputFiles(IMG);
  await popup.waitForTimeout(2000);
  await popup.locator('#submitBtn').click({ timeout: 10000 }).catch((e) => P('submitBtn 실패 ' + e.message.slice(0, 40)));
  await popup.waitForTimeout(7000).catch(() => {});
  P('타이틀 이미지 올림');
  await popup.close().catch(() => {});
} else {
  P('팝업이 안 떴습니다 — 직접 파일 지정 시도');
  await F.locator('input[type=file]').last().setInputFiles(IMG).catch((e) => P('실패 ' + e.message.slice(0, 40)));
}
await pg.waitForTimeout(3000);

// 블로그 제목 표시 끄기 (배너에 이름이 들어 있다)
const off = await F.evaluate(() => {
  const lab = [...document.querySelectorAll('label,span,a')].find((e) => /표시/.test(e.innerText || '') && e.offsetParent !== null);
  if (!lab) return '표시 토글 못 찾음';
  const cb = lab.querySelector('input[type=checkbox]') || (lab.htmlFor ? document.getElementById(lab.htmlFor) : null) || lab.closest('div')?.querySelector('input[type=checkbox]');
  if (cb && cb.checked) { cb.click(); return '제목 표시 껐습니다'; }
  return '제목 표시 이미 꺼짐/미발견';
});
P(off);

// 적용
const ap = await F.evaluate(() => {
  const e = [...document.querySelectorAll('a,button')].find((x) => (x.innerText || '').trim() === '적용' && x.offsetParent !== null);
  if (!e) return '적용 버튼 없음';
  e.click(); return '적용 눌렀음';
});
P(ap);
await pg.waitForTimeout(9000);
P('끝 · ' + pg.url().slice(0, 70));
await pg.screenshot({ path: '/tmp/title3.png', fullPage: false }).catch(() => {});
await ctx.close().catch(() => {});
