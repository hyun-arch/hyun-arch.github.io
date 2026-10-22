#!/usr/bin/env node
// 로그인이 잡히는 순간 쿠키를 붙잡아 두고, 카테고리까지 만든다. 한 번만 로그인하면 끝.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const ADMIN = `https://admin.blog.naver.com/${CFG.blogId}/config/topmenu`;
const P = (...a) => { const s = '  ' + a.join(' '); console.log(s); try { fs.appendFileSync('/tmp/kk.log', s + '\n'); } catch {} };

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
const live = async () => {
  const ck = await ctx.cookies('https://www.naver.com').catch(() => []);
  return ck.some((c) => c.name === 'NID_AUT') && ck.some((c) => c.name === 'NID_SES');
};

await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(2500);

if (!(await live())) {
  P('로그인 창 대기 중 — 찍으시면 그대로 이어갑니다.');
  const until = Date.now() + 3 * 60 * 60 * 1000;
  while (Date.now() < until && !(await live())) {
    await pg.waitForTimeout(2500);
    for (const t of ['등록안함', '등록 안함', '나중에']) {
      const b = pg.locator(`a:has-text("${t}"), button:has-text("${t}")`).first();
      if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(1200); }
    }
  }
}
if (!(await live())) { P('로그인 없음 — 종료'); process.exit(1); }

const n = await saveCookies(ctx);
P(`로그인 확인. 쿠키 ${n}개 저장 — 이제 풀리지 않습니다.`);
// 계속 살아 있게 주기적으로 갱신
setInterval(() => saveCookies(ctx), 20000);

await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(3000);
P('관리 화면: ' + pg.url());

// 왼쪽 메뉴에서 카테고리 설정을 찾는다
const nav = await pg.evaluate(() => [...document.querySelectorAll('a,button')]
  .map((e) => ({ t: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 20), h: e.getAttribute('href') || '' }))
  .filter((x) => x.t && (/카테고리|메뉴|글 관리|상단/.test(x.t) || /config/.test(x.h))));
P('메뉴: ' + nav.map((x) => x.t + (x.h ? '→' + x.h.replace(/^https?:\/\/[^/]+/, '') : '')).join(' | ').slice(0, 600));
await pg.screenshot({ path: '/tmp/kk.png', fullPage: true }).catch(() => {});
P('스크린샷 /tmp/kk.png · 창 유지');
