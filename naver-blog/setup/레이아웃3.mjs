import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/Layout/i.test(r.url()) && r.request().method() === 'POST') P('저장 ' + r.status() + ' ' + r.url().split('/').pop().split('?')[0]); });
await pg.goto('https://admin.blog.naver.com/LayoutSelect.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(5000);

const pick = await pg.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => /layout/i.test(i.src || ''));
  if (!imgs.length) return '썸네일 못 찾음';
  const first = imgs[0];
  const a = first.closest('a') || first.parentElement;
  a.click();
  return '첫 레이아웃 선택 (' + imgs.length + '종 중) · ' + (first.alt || first.src.split('/').pop());
});
P(pick);
await pg.waitForTimeout(2000);

await pg.locator('#doApplyConfirm').click({ timeout: 10000 }).catch((e) => P('적용 실패 ' + e.message.slice(0, 40)));
await pg.waitForTimeout(2500);
const ok = await pg.evaluate(() => {
  const el = [...document.querySelectorAll('a,button')].find((e) => e.offsetParent !== null && /^(확인|적용)$/.test((e.innerText || '').trim()) && !/doApplyConfirm/.test(e.id));
  if (!el) return '확인 버튼 없음';
  el.click(); return '확인 눌렀음';
});
P(ok);
await pg.waitForTimeout(9000);
P('끝');
await ctx.close().catch(() => {});
