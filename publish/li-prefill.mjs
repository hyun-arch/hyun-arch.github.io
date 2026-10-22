#!/usr/bin/env node
// 링크드인 글쓰기 창에 본문을 다 채워 두고, 사람이 「Post」만 누르도록 창을 열어 둔다.
//
//   node publish/li-prefill.mjs <본문파일>
//
// 왜 이렇게 하나: 링크드인이 자동 게시를 막는다
// (「We encountered a problem sharing your post」 — 2026-10-20 실측).
// 쓰는 일은 내가 다 하고, 마지막 한 번만 사람이 누른다.
import fs from 'node:fs';
import { openSns } from './web-login.mjs';

const text = fs.readFileSync(process.argv[2], 'utf8').trim();
const ctx = await openSns();   // 보이는 창
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);

await pg.locator(':is(button,div,span):is(:has-text("게시물 작성"),:has-text("Start a post"))')
        .last().click({ timeout: 25000 });
await pg.waitForTimeout(4000);

const box = pg.locator('dialog[open] div[contenteditable="true"]').first();
await box.click({ timeout: 25000 });
await pg.keyboard.insertText(text);
await pg.waitForTimeout(2000);

const len = await box.innerText().then((t) => t.length).catch(() => 0);
console.log(`
  ────────────────────────────────────────────────
   본문 ${len}자를 채워 두었습니다.

   창에서 오른쪽 아래 파란 「Post」 버튼만 눌러 주세요.

   (링크드인이 자동 게시를 막습니다. 쓰는 건 제가 다 했고
    마지막 클릭만 사람이 해야 통과합니다.)
  ────────────────────────────────────────────────
`);
await new Promise((resolve) => { ctx.on('close', resolve); });
