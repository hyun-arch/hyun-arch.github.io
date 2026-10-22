#!/usr/bin/env node
// 블로그 세팅 자동기 — 켜 두면 알아서 끝낸다.
//   node naver-blog/setup/auto.mjs
// 판정은 주소가 아니라 로그인 쿠키(NID_AUT/NID_SES)로 한다.
// 쿠키가 생기는 순간 페이지를 건드리지 않고 그대로 이어받는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const ADMIN = `https://admin.blog.naver.com/${CFG.blogId}`;
const LOGIN = 'https://nid.naver.com/nidlogin.login?url=' + encodeURIComponent(ADMIN);
const LOG = '/tmp/blog-setup.log';
const log = (...a) => { const s = a.join(' '); console.log(s); try { fs.appendFileSync(LOG, s + '\n'); } catch {} };
const shot = (pg, n) => pg.screenshot({ path: `/tmp/blog-${n}.png`, fullPage: false }).catch(() => {});

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());

// 로그인 쿠키가 있나 — 이것만이 유일한 판정 기준
async function hasSession() {
  const ck = await ctx.cookies('https://www.naver.com').catch(() => []);
  return ck.some((c) => c.name === 'NID_AUT') && ck.some((c) => c.name === 'NID_SES');
}

// 로그인 직후 뜨는 "기기 등록" 같은 중간 화면을 넘긴다
async function passInterstitials() {
  for (const t of ['등록안함', '등록 안함', '나중에', '취소', '건너뛰기']) {
    const b = pg.locator(`a:has-text("${t}"), button:has-text("${t}")`).first();
    if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(2000); log('  중간 화면 통과: ' + t); return; }
  }
}

if (!(await hasSession())) {
  log('\n  로그인 창을 띄웠습니다. QR만 찍으시면 그대로 이어서 끝냅니다.');
  await pg.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(1500);
  for (const s of ['a:has-text("QR코드")', 'a:has-text("QR 코드")', 'a[href*="qr"]']) {
    const el = pg.locator(s).first();
    if (await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
  }
  await pg.waitForTimeout(2000);
  await shot(pg, 'login');

  const until = Date.now() + 6 * 60 * 60 * 1000;
  let lastQr = Date.now();
  while (Date.now() < until) {
    await pg.waitForTimeout(3000);
    await passInterstitials();
    if (await hasSession()) { log('\n  로그인 확인됨.'); break; }
    // QR 이 만료됐을 때만, 그리고 여전히 로그인 페이지일 때만 새로 띄운다
    if (Date.now() - lastQr > 170000 && /nid\.naver\.com/.test(pg.url()) && !(await hasSession())) {
      await pg.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await pg.waitForTimeout(1200);
      for (const s of ['a:has-text("QR코드")', 'a:has-text("QR 코드")', 'a[href*="qr"]']) {
        const el = pg.locator(s).first();
        if (await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
      }
      lastQr = Date.now();
    }
  }
  if (!(await hasSession())) { log('  시간 초과로 종료합니다.'); process.exit(1); }
}

log('  세팅을 시작합니다.');
await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(3000);
await passInterstitials();
await shot(pg, 'admin');
log('  관리자: ' + pg.url());

// ── 카테고리 관리 화면으로 ──
let moved = false;
for (const label of ['카테고리 관리', '메뉴·글·동영상 관리', '메뉴 글 동영상 관리', '블로그 정보']) {
  const l = pg.locator(`a:has-text("${label}")`).first();
  if (await l.isVisible().catch(() => false)) {
    await l.click().catch(() => {}); await pg.waitForTimeout(3000); moved = true; log('  이동: ' + label); break;
  }
}
await shot(pg, 'category');
log('  현재 주소: ' + pg.url());

const seen = await pg.evaluate(() => {
  const t = (e) => (e.innerText || '').trim();
  return [...new Set([...document.querySelectorAll('a,button,li,td,span')].map(t).filter((s) => s && s.length < 24))].slice(0, 60);
}).catch(() => []);
fs.writeFileSync('/tmp/blog-screen.json', JSON.stringify(seen, null, 1));
log('  화면 항목 ' + seen.length + '개 → /tmp/blog-screen.json');
log('  스크린샷: /tmp/blog-category.png');
log('  (창은 열어 둡니다)\n');
