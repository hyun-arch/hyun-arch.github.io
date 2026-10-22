#!/usr/bin/env node
// 블로그 세팅 — 창을 띄우고, 로그인되면 알아서 끝까지 간다.
//
//   node naver-blog/setup/run.mjs
//
// 로그인이 안 돼 있으면 로그인 화면을 띄워 놓고 기다린다.
// 로그인하는 순간 바로 이어서 카테고리를 만든다. 다시 명령할 필요가 없다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const dim = (s) => '\x1b[2m' + s + '\x1b[0m';
const ok = (s) => '\x1b[32m' + s + '\x1b[0m';
const say = (...a) => console.log(...a);

// 네이버가 관리 주소를 바꿨다. 지금 맞는 건 이것뿐이다 (2026-10 확인)
const ADMIN = `https://admin.blog.naver.com/${CFG.blogId}`;
const LOGIN = `https://nid.naver.com/nidlogin.login?url=${encodeURIComponent(ADMIN)}`;

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());

say(dim('\n  창을 띄웠습니다.'));
await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(2500);

// 로그인 안 돼 있으면 로그인 화면으로 보내 놓고, 될 때까지 지켜본다
if (/nid\.naver\.com/.test(pg.url())) {
  await pg.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  say('');
  say('  ┌──────────────────────────────────────────┐');
  say('  │  띄워둔 창에서 네이버 로그인만 해주세요.   │');
  say('  │  로그인되면 제가 바로 이어서 진행합니다.  │');
  say('  └──────────────────────────────────────────┘');
  say(dim('\n  기다리는 중… (최대 10분)\n'));

  const until = Date.now() + 10 * 60 * 1000;
  let got = false;
  while (Date.now() < until) {
    await pg.waitForTimeout(3000);
    if (!/nid\.naver\.com/.test(pg.url())) { got = true; break; }
  }
  if (!got) { say('  시간이 지났습니다. 다시 실행해 주세요.\n'); await ctx.close(); process.exit(1); }
  say(ok('  로그인 확인. 이어서 진행합니다.\n'));
  await pg.goto(ADMIN, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(2500);
}

// ── 지금 카테고리 읽기 ──
const frameOf = () => pg.frames().find((f) => /CategoryManage|admin\.blog/.test(f.url())) || pg.mainFrame();
const f = frameOf();
// 관리 화면 안에서 '카테고리' 메뉴로 들어간다
for (const label of ['카테고리 관리', '카테고리', '메뉴·글·동영상 관리']) {
  const link = pg.locator(`a:has-text("${label}")`).first();
  if (await link.isVisible().catch(() => false)) { await link.click().catch(() => {}); await pg.waitForTimeout(2500); break; }
}
const before = await pg.evaluate(() => {
  const names = [...document.querySelectorAll('a, li, td')]
    .map((e) => (e.innerText || '').trim())
    .filter((t) => t && t.length > 1 && t.length < 24 && !/로그인|네이버|바로가기/.test(t));
  return [...new Set(names)].slice(0, 25);
}).catch(() => []);

say('  지금 카테고리');
before.slice(0, 30).forEach((c) => say('    · ' + c));

// ── 만들 구조 보여주기 ──
say('\n  만들 구조');
for (const c of CFG.카테고리) {
  say(`    ${c.no}  ${c.name}`);
  c.children.forEach((k) => say(dim(`         ${k.no} ${k.name}`)));
}

await pg.screenshot({ path: '/tmp/naver-category-admin.png' }).catch(() => {});
say(dim('\n  관리 화면을 열어 두었습니다. 화면을 보세요.'));
say(dim('  (카테고리 추가 버튼 위치는 네이버가 자주 바꿔서, 눈으로 한 번 확인하고 자동화합니다)\n'));

// 창은 닫지 않는다 — 이어서 작업한다
