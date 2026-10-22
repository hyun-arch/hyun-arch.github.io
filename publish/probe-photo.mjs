#!/usr/bin/env node
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${env().NAVER_BLOG_ID}/postwrite`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(2000);
  const f = pg.frames().find(x => /postwrite/i.test(x.url())) || pg.mainFrame();

  const dismiss = async (ms=12000) => {
    const until = Date.now()+ms;
    while (Date.now()<until) {
      const c = f.locator('.se-popup-button-cancel').first();
      if (await c.isVisible({timeout:400}).catch(()=>false)) { await c.click({force:true}).catch(()=>{}); await pg.waitForTimeout(700); return true; }
      await pg.waitForTimeout(400);
    }
    return false;
  };
  console.log('팝업 치움:', await dismiss());
  console.log('딤 남음:', await f.locator('.se-popup-dim').first().isVisible({timeout:800}).catch(()=>false));

  let fired = false;
  pg.on('filechooser', async (fc) => { fired = true; console.log('>> filechooser 발생'); await fc.setFiles([]).catch(()=>{}); });
  await f.locator('button.se-image-toolbar-button').first().click({ timeout: 10000 })
    .catch(e => console.log('클릭 실패:', e.message.split('\n')[0]));
  await pg.waitForTimeout(5000);
  console.log('filechooser 떴나:', fired);
} finally { await ctx.close().catch(()=>{}); }
