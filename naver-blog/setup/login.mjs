#!/usr/bin/env node
// 로그인 창 — QR 로 띄운다. 비밀번호를 외울 필요가 없다.
// 폰 네이버 앱 → 오른쪽 아래 메뉴 → QR 코드 찍기.
import { openBrowser } from '../../publish/naver-open.mjs';

const BLOG = 'ianlove80';
const ADMIN = `https://admin.blog.naver.com/${BLOG}`;
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());

await pg.goto('https://nid.naver.com/nidlogin.login?url=' + encodeURIComponent(ADMIN),
  { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(2000);

// QR 탭을 눌러 둔다 — 바로 찍을 수 있게
for (const sel of ['a:has-text("QR코드")', 'a:has-text("QR 코드")', '#qr', '.btn_qr', 'a[href*="qr"]']) {
  const el = pg.locator(sel).first();
  if (await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
}
await pg.waitForTimeout(2500);
await pg.screenshot({ path: '/tmp/naver-login-qr.png' }).catch(() => {});

console.log('\n  ┌────────────────────────────────────────────┐');
console.log('  │  QR 로그인 화면을 띄웠습니다.               │');
console.log('  │  폰 네이버 앱으로 QR 만 찍어주세요.         │');
console.log('  │  비밀번호 입력 필요 없습니다.               │');
console.log('  └────────────────────────────────────────────┘\n');

// 로그인되면 바로 관리 화면으로 넘어간다
const until = Date.now() + 15 * 60 * 1000;
while (Date.now() < until) {
  await pg.waitForTimeout(3000);
  if (!/nid\.naver\.com/.test(pg.url())) {
    console.log('  로그인 확인. 관리 화면으로 들어갑니다.\n');
    await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(3000);
    await pg.screenshot({ path: '/tmp/naver-admin.png' }).catch(() => {});
    console.log('  준비 끝. 이제 카테고리를 만들 수 있습니다.\n');
    break;
  }
}
