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

await F.evaluate(() => { const e = [...document.querySelectorAll('a')].find((x) => (x.innerText || '').trim() === '직접등록' && x.offsetParent !== null); if (e) e.click(); });
await pg.waitForTimeout(2000);

await F.locator('#titleInputFile').setInputFiles(IMG);
await pg.waitForTimeout(7000);
P('파일 넣음');

// 배너에 블로그 이름이 들어 있으니 제목 표시는 끈다
const t = await F.evaluate(() => {
  const cb = document.getElementById('chk_title_display');
  if (!cb) return '표시 토글 없음';
  if (cb.checked) { cb.click(); return '제목 표시 껐습니다'; }
  return '제목 표시 이미 꺼짐';
});
P(t);

// 영역 높이를 이미지에 맞춘다 (300)
const hgt = await F.evaluate(() => {
  const i = [...document.querySelectorAll('input[type=text],input[type=number]')].find((x) => /^\d{2,3}$/.test(x.value || '') && x.offsetParent !== null);
  if (!i) return '높이칸 없음';
  const was = i.value;
  i.value = '300';
  i.dispatchEvent(new Event('input', { bubbles: true }));
  i.dispatchEvent(new Event('change', { bubbles: true }));
  return `높이 ${was} → 300`;
});
P(hgt);

// 적용 → 확인 레이어의 버튼까지 눌러야 저장된다
await F.locator('.btn_submit._showConfirmLayer').first().click({ timeout: 10000 }).catch((e) => P('적용 실패 ' + e.message.slice(0, 40)));
P('적용 눌렀음');
await pg.waitForTimeout(2500);
const done = await F.evaluate(() => {
  const el = [...document.querySelectorAll('a,button')].find((e) => /_submit/.test((e.className || '').toString()) && e.offsetParent !== null);
  if (!el) return '확인 버튼 없음';
  el.click();
  return '확인 눌렀음: ' + (el.innerText || '').trim().slice(0, 10);
});
P(done);
await pg.waitForTimeout(9000);
P('끝 · ' + pg.url().slice(0, 60));
await ctx.close().catch(() => {});
