import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const shot = process.argv[2];
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${env().NAVER_BLOG_ID}/postwrite`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(6000);
  console.log('프레임들:');
  for (const fr of pg.frames()) console.log('  -', fr.url().slice(0,90));
  const f = pg.frames().find(x=>/PostWriteForm|postwrite/i.test(x.url())) || pg.mainFrame();
  console.log('선택된 프레임:', f.url().slice(0,90));

  // 팝업
  const dim = await f.locator('.se-popup-dim').first().isVisible({timeout:1500}).catch(()=>false);
  console.log('팝업 딤:', dim);
  if (dim) {
    const c = f.locator('.se-popup button:has-text("취소")').first();
    console.log('  취소 버튼 보임:', await c.isVisible({timeout:1500}).catch(()=>false));
    await c.click().catch(e=>console.log('  취소 클릭 실패:', e.message.split('\n')[0]));
    await pg.waitForTimeout(1500);
    console.log('  닫은 뒤 딤:', await f.locator('.se-popup-dim').first().isVisible({timeout:1000}).catch(()=>false));
  }
  for (const sel of ['.se-section-documentTitle .se-text-paragraph','.se-documentTitle .se-text-paragraph',
                     '.se-section-documentTitle','.se-placeholder','[contenteditable="true"]']) {
    const n = await f.locator(sel).count().catch(()=>0);
    const v = n ? await f.locator(sel).first().isVisible({timeout:800}).catch(()=>false) : false;
    console.log(`  ${sel}  개수=${n} 보임=${v}`);
  }
  if (shot) { await pg.screenshot({path:shot}); console.log('캡처:', shot); }
} finally { await ctx.close().catch(()=>{}); }
