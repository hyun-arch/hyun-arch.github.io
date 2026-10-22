import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${env().NAVER_BLOG_ID}/postwrite`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(6000);
  const f = pg.frames().find(x=>/postwrite/i.test(x.url())) || pg.mainFrame();
  const c = f.locator('.se-popup button:has-text("취소")').first();
  if (await c.isVisible({timeout:2000}).catch(()=>false)) { await c.click(); await pg.waitForTimeout(1500); }
  const info = await f.locator('button[class*="strikethrough"], button[class*="bold"], button[class*="italic"], button[class*="underline"]')
    .evaluateAll(els => els.map(e => ({ cls: e.className, aria: e.getAttribute('aria-pressed'), label:(e.getAttribute('aria-label')||'').split('\n')[0] })));
  console.log(JSON.stringify(info, null, 1));
} finally { await ctx.close().catch(()=>{}); }
