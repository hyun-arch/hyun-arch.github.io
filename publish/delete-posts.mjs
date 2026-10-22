#!/usr/bin/env node
// 지정한 글만 삭제한다. 삭제 직전에 제목을 다시 읽어, 기대한 제목일 때만 지운다.
//   node publish/delete-posts.mjs <logNo> "기대 제목 일부" <logNo> "기대 제목 일부" ...
// 되돌릴 수 없는 작업이라, 제목이 안 맞으면 그 글은 건너뛴다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';

const blogId = env().NAVER_BLOG_ID;
const pairs = [];
for (let i = 2; i < process.argv.length; i += 2) pairs.push([process.argv[i], process.argv[i + 1]]);

const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  for (const [no, expect] of pairs) {
    await pg.goto('https://blog.naver.com/' + blogId + '/' + no,
                  { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3500);
    const f = pg.frames().find((x) => /PostView|blog\.naver/.test(x.url())) || pg.mainFrame();

    // 제목 확인 — 이게 안 맞으면 절대 지우지 않는다
    const title = await f.evaluate(() => {
      const t = document.querySelector('.se-title-text, .se-documentTitle, .pcol1 .htitle');
      return (t ? t.innerText : document.title || '').replace(/\s+/g, ' ').trim();
    }).catch(() => '');
    if (!title.includes(expect)) {
      console.log('  건너뜀  ' + no + ' — 제목이 "' + expect + '"를 안 담음 (실제: "' + title.slice(0, 40) + '")');
      continue;
    }

    // 삭제 버튼
    let clicked = false;
    for (const sel of ['a.btn_delete', 'a:has-text("삭제")', 'button:has-text("삭제")', '[class*="delete"]']) {
      const b = f.locator(sel).first();
      if (await b.isVisible({ timeout: 1500 }).catch(() => false)) { await b.click().catch(() => {}); clicked = true; break; }
    }
    if (!clicked) { console.log('  삭제버튼 못 찾음  ' + no); continue; }
    await pg.waitForTimeout(1200);

    // 확인 팝업
    for (const sel of ['.btn_ok', 'button:has-text("확인")', 'a:has-text("삭제")', 'button:has-text("삭제")']) {
      const b = f.locator(sel).last();
      if (await b.isVisible({ timeout: 1500 }).catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await pg.waitForTimeout(2500);
    console.log('  삭제함  ' + no + '  "' + title.slice(0, 40) + '"');
  }
} finally { await ctx.close().catch(() => {}); }
