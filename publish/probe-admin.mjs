#!/usr/bin/env node
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const blogId = env().NAVER_BLOG_ID;
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://admin.blog.naver.com/PostManage.naver?blogId=${blogId}`,
                { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(4000);
  console.log('주소:', pg.url().slice(0,90));
  for (const fr of pg.frames()) {
    const r = await fr.evaluate(() => {
      const rows = [];
      document.querySelectorAll('tr, li').forEach(e => {
        const t = (e.innerText||'').replace(/\s+/g,' ').trim();
        if (/두피/.test(t) && t.length < 150) {
          const cb = e.querySelector('input[type=checkbox]');
          rows.push({ t: t.slice(0,70), cb: cb ? (cb.value||cb.id||'있음') : '없음' });
        }
      });
      const btns = [...document.querySelectorAll('a,button')]
        .map(e => (e.innerText||'').trim()).filter(t => /삭제/.test(t) && t.length<10);
      return { rows: rows.slice(0,8), btns: [...new Set(btns)].slice(0,5) };
    }).catch(() => null);
    if (r && (r.rows.length || r.btns.length)) {
      console.log('프레임:', fr.url().slice(0,60));
      console.log(JSON.stringify(r, null, 1));
    }
  }
} finally { await ctx.close().catch(()=>{}); }
