#!/usr/bin/env node
// 블로그에 실제로 발행된 글 목록을 읽는다. 아무것도 바꾸지 않는다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const blogId = env().NAVER_BLOG_ID;
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=0&from=postList`,
                { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(4000);
  for (const fr of pg.frames()) {
    const got = await fr.evaluate(() => {
      const out = [];
      document.querySelectorAll('a').forEach((a) => {
        const t = (a.innerText || '').trim().replace(/\s+/g, ' ');
        const h = a.getAttribute('href') || '';
        if (t.length > 8 && /logNo=|\/\d{9,}/.test(h)) out.push({ t: t.slice(0, 60), h });
      });
      return out;
    }).catch(() => []);
    if (got.length) {
      const seen = new Set();
      for (const g of got) {
        const no = (g.h.match(/(\d{9,})/) || [])[1];
        if (!no || seen.has(no)) continue;
        seen.add(no);
        console.log(`${no}  ${g.t}`);
      }
      break;
    }
  }
} finally { await ctx.close().catch(() => {}); }
