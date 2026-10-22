#!/usr/bin/env node
// 네이버 블로그 저장 글을 사람이 보도록 창을 띄워 둔다.
//
//   node publish/drafts-open.mjs
//
// 왜 따로 만들었나:
//   naver-open.mjs 는 로그인용이라 로그인 페이지로 가고, 스크립트가 끝나면 창도 닫힌다.
//   (playwright 컨텍스트는 node 프로세스가 살아 있는 동안만 산다 — 2026-10-20 실측)
//   이 파일은 글쓰기 화면으로 바로 가고, 사람이 창을 닫을 때까지 기다린다.
//
// 아무것도 누르지 않는다. 저장도 발행도 하지 않는다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';

const blogId = env().NAVER_BLOG_ID;
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto(`https://blog.naver.com/${blogId}/postwrite`,
              { waitUntil: 'domcontentloaded', timeout: 60000 });

console.log(`
  ────────────────────────────────────────────────
   네이버 글쓰기 창을 띄웠습니다.

   1. 「작성 중인 글이 있습니다」가 뜨면 → 취소
   2. 오른쪽 위 「저장 N」을 누르면 저장 글 목록이 열립니다
   3. 열어서 확인하시고, 발행 버튼은 직접 눌러 주세요

   창을 닫으면 이 프로그램도 끝납니다.
  ────────────────────────────────────────────────
`);

// 사람이 창을 닫을 때까지 살아 있는다
await new Promise((resolve) => {
  pg.on('close', resolve);
  ctx.on('close', resolve);
});
console.log('  창이 닫혔습니다.');
