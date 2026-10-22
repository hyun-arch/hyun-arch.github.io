#!/usr/bin/env node
// 링크드인에 글을 올린다. web-login.mjs 로 로그인해 둔 전용 브라우저를 쓴다.
//   node publish/li-web-post.mjs <본문파일> [이미지경로]
import fs from 'node:fs';
import { openSns } from './web-login.mjs';

const [textFile, img] = process.argv.slice(2);
if (!textFile) { console.log('쓰는 법: li-web-post.mjs <본문파일> [이미지]'); process.exit(1); }
const text = fs.readFileSync(textFile, 'utf8').trim();

const ctx = await openSns();
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(4000);
  if (/\/login|authwall|\/uas\//.test(pg.url())) {
    console.log('\n  로그인이 안 돼 있습니다. node publish/web-login.mjs 로 먼저 로그인해 주세요.\n');
    process.exit(1);
  }

  // 「게시물 작성」 열기
  // 「Start a post」 는 button 이 아니라 div 다 — 태그를 가리지 않고 찾는다 (2026-10-20 실측)
  await pg.locator(':is(button,div,span)' +
      ':is(:has-text("게시물 작성"),:has-text("Start a post"))').last()
          .click({ timeout: 20000 });
  await pg.waitForTimeout(3000);

  // 다이얼로그 안에서만 찾는다 — 바깥 요소가 클릭을 가로챈다 (2026-10-20 실측)
  const dlg = pg.locator('dialog[open]');
  await dlg.waitFor({ timeout: 20000 });

  // 본문 — tiptap/ProseMirror 편집기
  const box = dlg.locator('div[contenteditable="true"]').first();
  await box.click({ timeout: 20000 });
  await pg.keyboard.insertText(text);
  await pg.waitForTimeout(1500);

  // 이미지 — 버튼 이름이 「Media」다
  if (img) {
    try {
      const chooser = pg.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
      await dlg.locator(':is(button,div[role="button"]):has-text("Media")').first().click();
      const fc = await chooser;
      if (!fc) throw new Error('파일 선택창이 안 열렸습니다');
      fc.setFiles(img);
      await pg.waitForTimeout(7000);
      await pg.locator(':is(button,div[role="button"]):is(:has-text("Next"),:has-text("다음"))')
              .last().click({ timeout: 12000 }).catch(() => {});
      await pg.waitForTimeout(3000);
    } catch (e) { console.log('  (이미지는 못 붙였습니다 — 글만 올립니다)'); }
  }

  // 게시 — 「Post」 버튼. 다이얼로그가 바뀌었을 수 있으니 다시 잡는다
  const d2 = pg.locator('dialog[open]').last();
  await d2.locator(':is(button,div[role="button"])')
          .filter({ hasText: /^(Post|게시하기|게시)$/ }).last()
          .click({ timeout: 20000 });
  await pg.waitForTimeout(10000);
  console.log('\n  링크드인에 올렸습니다.\n');
} finally { await ctx.close().catch(() => {}); }
