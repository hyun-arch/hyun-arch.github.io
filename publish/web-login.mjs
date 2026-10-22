#!/usr/bin/env node
// 인스타그램·링크드인에 글을 올릴 전용 브라우저를 띄운다.
//
//   node publish/web-login.mjs
//
// 왜 이렇게 하나:
//   메타 앱(arami-autopost)이 「추가 상세 정보 업데이트 중」 상태라 API 토큰을 못 받는다.
//   그렇다고 사람이 쓰는 크롬을 내가 조작할 수는 없다(크롬이 막고, 저장된 로그인은 건드리면 안 된다).
//   그래서 네이버에 쓰던 방식 그대로 — 내 전용 프로필 브라우저를 띄우고,
//   사람이 거기서 한 번만 로그인하면 그다음부터는 내가 직접 올린다.
//
// 비밀번호도 쿠키도 내가 읽지 않는다. 그 브라우저가 자기 폴더에 알아서 들고 있는다.
// 프로필 폴더: publish/.browser-sns  (git 제외)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SNS_PROFILE = path.join(HERE, '.browser-sns');

export async function openSns({ headless = false } = {}) {
  return chromium.launchPersistentContext(SNS_PROFILE, {
    channel: 'chrome',
    headless,
    viewport: null,
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });
}

const isMain = (() => {
  try { return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || ''); }
  catch { return false; }
})();

if (isMain) {
  const ctx = await openSns();
  const ig = ctx.pages()[0] || (await ctx.newPage());
  await ig.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });
  const li = await ctx.newPage();
  await li.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

  console.log(`
  ────────────────────────────────────────────────
   전용 브라우저를 띄웠습니다. 탭 두 개가 있습니다.

     1번 탭  인스타그램 로그인
     2번 탭  링크드인 로그인

   두 곳에 로그인만 해 주세요. 한 번만 하면 됩니다.
   로그인 끝나면 이 창은 그대로 두세요 — 제가 이어서 올립니다.

   (이 브라우저는 평소 쓰시는 크롬과 별개입니다.
    비밀번호는 저장도 열람도 하지 않습니다.)
  ────────────────────────────────────────────────
`);
  await new Promise((resolve) => { ctx.on('close', resolve); });
  console.log('  창이 닫혔습니다.');
}
