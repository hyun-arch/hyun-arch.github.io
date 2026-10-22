// 중복으로 올라간 글 하나를 지운다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const LOGNO = '224447202257';
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
await pg.goto(`https://blog.naver.com/ianlove80/${LOGNO}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(5000);
await saveCookies(ctx);
const f = pg.frames().find((fr) => /PostView|mainFrame/i.test(fr.url())) || pg.mainFrame();
const title = await f.evaluate(() => (document.querySelector('.se-title-text, .pcol1') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 40) || '-');
P('지울 글: ' + title);
const hit = await f.evaluate(() => {
  const el = [...document.querySelectorAll('a,button')].find((e) => (e.innerText || '').trim() === '삭제' && e.offsetParent !== null);
  if (!el) return null;
  el.click(); return '삭제 눌렀음';
});
P(hit || '삭제 버튼 못 찾음');
await pg.waitForTimeout(2500);
// 확인 레이어
const ok = await f.evaluate(() => {
  const el = [...document.querySelectorAll('a,button')].find((e) => e.offsetParent !== null && /^(삭제|확인)$/.test((e.innerText || '').trim()) && /btn|confirm/i.test((e.className || '').toString()));
  if (!el) return null;
  el.click(); return '확인 눌렀음';
});
P(ok || '확인 버튼 없음');
await pg.waitForTimeout(6000);
P('지금: ' + pg.url().slice(0, 70));
await ctx.close().catch(() => {});
