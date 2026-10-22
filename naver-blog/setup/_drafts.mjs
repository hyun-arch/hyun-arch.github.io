// 임시저장 목록 확인 — 아무것도 바꾸지 않고 보기만 한다.
import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80/postwrite', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);

// 팝업부터 치운다 — 취소를 눌러야 임시저장을 안 불러온다
const f = pg.frames().find((fr) => /PostWriteForm|postwrite/i.test(fr.url())) || pg.mainFrame();
const pop = f.locator('.se-popup-alert-confirm').first();
if (await pop.isVisible().catch(() => false)) {
  const txt = (await pop.innerText().catch(() => '')).replace(/\s+/g, ' ');
  console.log('  팝업:', txt.slice(0, 80));
  const btns = await pop.locator('button').allInnerTexts().catch(() => []);
  console.log('  버튼:', btns.join(' | '));
  const cancel = pop.locator('button.se-popup-button-cancel, button:has-text("취소")').first();
  if (await cancel.isVisible().catch(() => false)) { await cancel.click(); console.log('  취소 눌러 새 글로 시작'); }
  await pg.waitForTimeout(1500);
}

// 저장 목록 열기
const saveBtn = f.locator('button:has-text("저장")').first();
if (await saveBtn.isVisible().catch(() => false)) {
  const cnt = await saveBtn.innerText().catch(() => '');
  console.log('  저장 버튼:', cnt.replace(/\s+/g, ' '));
}
const listBtn = f.locator('.header_save_count__OVRtY, button[class*="save_count"], a:has-text("저장")').first();
if (await listBtn.isVisible().catch(() => false)) { await listBtn.click().catch(() => {}); await pg.waitForTimeout(2000); }
const items = await f.locator('.se-sidebar-item, [class*="draft"] li, .list_save li').allInnerTexts().catch(() => []);
console.log('  임시저장 항목 ' + items.length + '개');
for (const i of items.slice(0, 12)) console.log('    · ' + i.replace(/\s+/g, ' ').slice(0, 70));
await pg.screenshot({ path: '/tmp/drafts.png', fullPage: false }).catch(() => {});
console.log('  스크린샷 /tmp/drafts.png');
