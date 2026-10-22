#!/usr/bin/env node
// 인스타그램 로그인 창만 띄운다. 로그인되면 바로 글을 채워 준다.
//   node publish/ig-login.mjs
import { openSns } from './web-login.mjs';

const ctx = await openSns();
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log(`
  ────────────────────────────────────────────────
   인스타그램 로그인 창입니다. 여기서 로그인해 주세요.

   ※ 「Facebook으로 로그인」 말고 위쪽 칸에
     인스타그램 아이디·비밀번호를 직접 넣는 쪽이 잘 됩니다.
     (ianlove99)

   로그인되면 창을 그대로 두세요 — 제가 글을 채웁니다.
  ────────────────────────────────────────────────
`);
// 로그인될 때까지 지켜본다
for (let i = 0; i < 240; i++) {
  await pg.waitForTimeout(5000);
  if (!/accounts\/login|challenge|two_factor/.test(pg.url())) {
    console.log('  ✓ 로그인 확인됐습니다.');
    break;
  }
}
await new Promise((r) => ctx.on('close', r));
