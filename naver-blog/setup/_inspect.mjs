import fs from 'node:fs';
import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80/postwrite', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4500);
const f = pg.frames().find((fr) => /PostWriteForm|postwrite/i.test(fr.url())) || pg.mainFrame();
console.log('프레임:', f.url().slice(0, 80));
const pop = f.locator('.se-popup-alert-confirm').first();
console.log('팝업 보임?', await pop.isVisible().catch(() => false));
if (await pop.isVisible().catch(() => false)) {
  await pop.locator('button:has-text("취소")').first().click().catch(() => {});
  await pg.waitForTimeout(1500);
  console.log('취소 눌렀고 팝업 남았나?', await pop.isVisible().catch(() => false));
}
const t = await f.locator('.se-section-documentTitle').first().innerText().catch(() => '(없음)');
const b = await f.locator('.se-component.se-text').allInnerTexts().catch(() => []);
console.log('제목:', JSON.stringify(t.replace(/\s+/g, ' ').slice(0, 60)));
console.log('본문 문단 수:', b.length);
console.log('본문 앞부분:', JSON.stringify(b.join(' ').replace(/\s+/g, ' ').slice(0, 200)));
fs.writeFileSync('/tmp/editor-text.txt', b.join('\n'));
await pg.screenshot({ path: '/tmp/editor-top.png' }).catch(() => {});
