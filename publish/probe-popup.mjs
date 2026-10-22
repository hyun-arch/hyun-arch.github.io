#!/usr/bin/env node
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${env().NAVER_BLOG_ID}/postwrite`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(7000);
  for (const fr of pg.frames()) {
    const info = await fr.evaluate(() => {
      const pop = document.querySelector('.se-popup, [class*="se-popup-alert"]');
      if (!pop) return null;
      return {
        visible: !!pop.offsetParent,
        html: pop.innerHTML.replace(/\s+/g,' ').slice(0, 700),
        buttons: [...pop.querySelectorAll('button,a')].map(b => ({
          text: (b.innerText||b.textContent||'').trim().slice(0,20),
          cls: b.className.slice(0,60), vis: !!b.offsetParent })),
      };
    }).catch(()=>null);
    if (info) { console.log('프레임:', fr.url().slice(0,60)); console.log(JSON.stringify(info, null, 1)); }
  }
} finally { await ctx.close().catch(()=>{}); }
