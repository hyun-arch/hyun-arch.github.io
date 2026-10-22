#!/usr/bin/env node
// SNS 작업용 브라우저를 하나만 띄워 두고 계속 쓴다.
//
//   node publish/sns-session.mjs          띄우고 그대로 둔다
//
// 왜 —
//   작업마다 브라우저를 띄우고 죽이다 보니 로그인이 계속 날아갔다.
//   (2026-10-20~22: 네이버·인스타 로그인을 여러 번 다시 하시게 했다. 내 탓이다.)
//   하나를 띄워 두고 이 세션 내내 쓴다. 다시는 pkill 로 죽이지 않는다.
//
//   다른 스크립트는 이 브라우저에 붙는다 — publish/.browser-sns 프로필을 공유한다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-sns'), {
  headless: false, viewport: null, locale: 'ko-KR',
  args: ['--window-size=1500,1000'],
});

const 탭 = [
  ['스레드',   'https://www.threads.com/@ianlove99'],
  ['인스타',   'https://www.instagram.com/ianlove99/'],
  ['링크드인', 'https://www.linkedin.com/in/me/recent-activity/shares/'],
];
for (const [, url] of 탭) {
  const pg = ctx.pages().find(p => p.url() === 'about:blank') || await ctx.newPage();
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
}

console.log(`
  ────────────────────────────────────────────────
   SNS 작업 브라우저입니다. 이 창을 닫지 마세요.

     탭1  스레드     탭2  인스타     탭3  링크드인

   로그인이 풀린 곳만 로그인해 주세요.
   이 창은 제가 죽이지 않습니다 — 이 세션 내내 씁니다.
  ────────────────────────────────────────────────
`);
await new Promise(() => {});   // 계속 떠 있는다
