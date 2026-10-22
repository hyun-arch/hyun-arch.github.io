#!/usr/bin/env node
// 네이버 블로그 저장 글 목록을 받아 사이트가 읽을 파일로 떨군다.
//   node publish/draft-list.mjs
//
// 왜 — 네이버 TempPostList API 는 다른 도메인에서 부르면 CORS 로 막힌다.
// 그래서 여기서 받아 public/drafts.json 에 적어 두고, /drafts 페이지가 그걸 읽는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from './naver-open.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../public/drafts.json');
const BLOG = 'ianlove80';

const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${BLOG}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await pg.waitForTimeout(2500);
  const d = await pg.evaluate(async (blog) => {
    const r = await fetch(`https://admin.blog.naver.com/TempPostList.naver?blogId=${blog}`,
                          { credentials: 'include' });
    return r.json();
  }, BLOG);

  const 글 = (d?.result?.tempPostList || []).map((x) => ({
    logNo: x.logNo, title: x.title, modiDate: x.modiDate,
  }));
  fs.writeFileSync(OUT, JSON.stringify({ 잰때: Date.now(), 글 }, null, 1), 'utf8');
  console.log(`  저장 글 ${글.length}건 → public/drafts.json`);
  글.forEach((x) => console.log(`    · ${x.title.slice(0, 40)}`));
} finally {
  await ctx.close().catch(() => {});
}
