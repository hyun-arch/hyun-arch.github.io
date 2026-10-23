#!/usr/bin/env node
// 카페24 관리자에 JSON-LD 를 넣는다. **로그인될 때까지 기다렸다가 그 자리에서 끝낸다.**
//
//   node publish/cafe24-jsonld.mjs            둘러보기만 한다 (어디에 넣을지 찾는다)
//   node publish/cafe24-jsonld.mjs --적용     실제로 넣는다
//
// 왜 이렇게 만들었나 (2026-10-23) —
//   전에는 ① 로그인 창을 띄우는 프로그램과 ② 들어가서 일하는 프로그램을 나눴다.
//   그런데 **같은 프로필을 두 번 열 수 없다.** 확인하려고 두 번째를 열면 빈 프로필을 본다.
//   그래서 창을 닫고 확인했는데, 그 닫는 과정에서 **로그인 세션이 날아갔다.**
//   한 프로그램이 창을 띄우고 · 기다리고 · 일까지 하면 그런 일이 없다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const 적용 = process.argv.includes('--적용');
const 프로필 = path.join(HERE, '.browser-site');
const 관리자 = 'https://atolian.cafe24.com/admin/php/main.php';

const ctx = await chromium.launchPersistentContext(프로필, {
  headless: false,
  viewport: { width: 1480, height: 920 },
  args: ['--disable-blink-features=AutomationControlled'],
});
// 세션이 날아가지 않도록, 끊길 때 곱게 닫는다
let 닫는중 = false;
const 곱게닫기 = async () => {
  if (닫는중) return; 닫는중 = true;
  await ctx.close().catch(() => {});
  process.exit(0);
};
process.on('SIGTERM', 곱게닫기);
process.on('SIGINT', 곱게닫기);

const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { console.log('  알림:', d.message().slice(0, 60)); await d.accept().catch(() => {}); });

// 로그인은 **다른 탭에서** 끝날 수 있다. 첫 탭만 보면 영영 「아직」이 된다. (2026-10-23 당함)
const 로그인됐나 = async () => {
  for (const p of ctx.pages()) {
    const u = p.url();
    if (/atolian\.cafe24\.com\/(admin|disp)/i.test(u)) {
      const 비번칸 = await p.evaluate(() => !!document.querySelector('input[type=password]')).catch(() => true);
      if (!비번칸) return p;
    }
  }
  // 쿠키로도 본다 — 세션 쿠키가 있으면 들어가 본다
  const ck = await ctx.cookies('https://atolian.cafe24.com').catch(() => []);
  if (ck.some((c) => c.name === 'ECSESSID') && ck.some((c) => c.name === 'PHPSESSVERIFY')) {
    const p = ctx.pages()[0] || (await ctx.newPage());
    await p.goto(관리자, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(2500);
    const 비번칸 = await p.evaluate(() => !!document.querySelector('input[type=password]')).catch(() => true);
    if (!비번칸) return p;
  }
  return null;
};
const 로그인화면 = async () => !(await 로그인됐나());

await pg.goto(관리자, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(3000);

if (await 로그인화면()) {
  console.log(`
  ┌──────────────────────────────────────────────┐
  │  지금 떠 있는 이 창에서 로그인해 주세요.         │
  │    상점 아이디 : atolian                      │
  │  로그인하시면 제가 알아서 이어서 합니다.         │
  │  이 창은 제가 닫지 않습니다.                   │
  └──────────────────────────────────────────────┘
  기다리는 중…`);
  const 끝 = Date.now() + 30 * 60 * 1000;      // 30분 기다린다
  while (Date.now() < 끝) {
    await pg.waitForTimeout(5000);
    if (!(await 로그인화면())) break;
    // 로그인 뒤 다른 데로 갔을 수 있으니 관리자로 다시 가 본다
    if (/eclogin/i.test(pg.url())) continue;
    await pg.goto(관리자, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  }
  if (await 로그인화면()) {
    console.log('  30분 동안 로그인이 안 돼 멈춥니다. 다시 돌려 주세요.');
    await 곱게닫기();
  }
}

console.log('  ✓ 로그인 확인. 들어갑니다.\n');
await pg.goto(관리자, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
await pg.waitForTimeout(3000);
console.log('  지금 주소:', pg.url().slice(0, 80));
console.log('  제목:', (await pg.title()).slice(0, 60));

// 멀티쇼핑몰이 몇 개인지, 디자인(스킨)이 몇 개인지 본다
const 둘러보기 = async (url, 이름) => {
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
  await pg.waitForTimeout(2500);
  const 글 = await pg.evaluate(() => (document.body.innerText || '')
    .split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 40).join(' | ')).catch(() => '');
  console.log(`\n── ${이름} ──\n  ${pg.url().slice(0, 80)}\n  ${글.slice(0, 500)}`);
};

await 둘러보기('https://atolian.cafe24.com/admin/php/shop/shop_list.php', '멀티쇼핑몰 목록');
await 둘러보기('https://atolian.cafe24.com/disp/admin/shop1/design/DesignSkinManage', '디자인(스킨) 관리');

await pg.screenshot({ path: '/tmp/cafe24-admin.png' }).catch(() => {});
console.log('\n  화면: /tmp/cafe24-admin.png');
console.log('  (창은 그대로 둡니다. 다음 단계로 바로 이어서 넣겠습니다.)');

// 창을 열어 둔다 — 다음 단계에서 같은 창으로 이어서 일한다
await new Promise(() => {});
