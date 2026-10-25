#!/usr/bin/env node
// 발행된 글 몇 개를 열어 내용을 비교한다. 읽기만 한다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const blogId = env().NAVER_BLOG_ID;
const nos = process.argv.slice(2);
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  for (const no of nos) {
    await pg.goto(`https://blog.naver.com/${blogId}/${no}`,
                  { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3500);
    let info = null;
    for (const fr of pg.frames()) {
      info = await fr.evaluate(() => {
        const body = document.querySelector('.se-content, .se-canvas, .se-main-container');
        if (!body) return null;
        const imgs = body.querySelectorAll('img').length;
        const text = (body.innerText || '').replace(/\s+/g, ' ').trim();
        const date = (document.querySelector('.se_publishDate, .blog2_container .date')||{}).innerText || '';
        const mdLeft = (text.match(/!\[|\]\(|^##\s|\*\*/gm) || []).length;
        return { imgs, len: text.length, head: text.slice(0, 70), date: date.trim(), mdLeft };
      }).catch(() => null);
      if (info) break;
    }
    console.log(info
      ? `${no}  이미지 ${String(info.imgs).padStart(2)}장 · ${String(info.len).padStart(5)}자 · 마크다운잔재 ${info.mdLeft} · ${info.date}\n       ${info.head}`
      : `${no}  (본문을 읽지 못함)`);
  }
} finally { await ctx.close().catch(() => {}); }
