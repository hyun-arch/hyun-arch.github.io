#!/usr/bin/env node
// 글 화면에 삭제 버튼이 어떻게 생겼는지 본다. 누르지 않는다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const blogId = env().NAVER_BLOG_ID;
const no = process.argv[2];
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${blogId}/${no}`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(4000);
  for (const fr of pg.frames()) {
    const r = await fr.evaluate(() => {
      const hits = [];
      document.querySelectorAll('a,button').forEach(e => {
        const t = (e.innerText||e.textContent||'').trim();
        if (/삭제|수정|설정/.test(t) && t.length < 10)
          hits.push({ t, tag: e.tagName, href: (e.getAttribute('href')||'').slice(0,90), cls: e.className.slice(0,50) });
      });
      return hits.slice(0, 8);
    }).catch(() => []);
    if (r.length) { console.log('프레임:', fr.url().slice(0,60)); console.log(JSON.stringify(r, null, 1)); }
  }
} finally { await ctx.close().catch(()=>{}); }
