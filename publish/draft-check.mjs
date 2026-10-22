#!/usr/bin/env node
// 네이버 블로그 임시저장이 실제로 들어갔는지, 내용까지 맞는지 확인한다.
//   node publish/draft-check.mjs [스크린샷경로]
// 저장된 글을 불러와 제목·본문 앞부분을 읽을 뿐, 발행도 저장도 하지 않는다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';

const shot = process.argv[2];
const blogId = env().NAVER_BLOG_ID;
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${blogId}/postwrite`,
                { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(5000);
  const f = pg.frames().find((x) => /postwrite/i.test(x.url())) || pg.mainFrame();

  // 저장 개수 — 「저장」 글자와 숫자가 서로 다른 요소라 상위 컨테이너를 통째로 읽는다
  let saved = '';
  try {
    saved = (await f.locator('button:has-text("저장")').first()
                   .evaluate((el) => (el.closest('div') || el).innerText)).trim().replace(/\s+/g, ' ');
  } catch {}

  // 「작성 중인 글이 있습니다」 → 확인을 눌러 불러온다 (불러오기는 저장도 발행도 아니다)
  let restored = false;
  try {
    const ok = f.locator('button:has-text("확인"), a:has-text("확인")').first();
    if (await ok.isVisible({ timeout: 3000 })) { await ok.click(); restored = true; await pg.waitForTimeout(4000); }
  } catch {}

  const read = async (sel) => {
    try { return (await f.locator(sel).first().innerText({ timeout: 4000 })).trim().replace(/\s+/g, ' '); }
    catch { return ''; }
  };
  const title = await read('.se-documentTitle, [class*="documentTitle"]');
  const body  = await read('.se-component-content, .se-main-container');

  console.log(JSON.stringify({
    저장개수: saved, 불러옴: restored,
    제목: title.slice(0, 90),
    본문앞: body.replace(/\n/g, ' ').slice(0, 160),
    본문길이: body.length,
  }, null, 2));
  if (shot) { await pg.screenshot({ path: shot }); console.log('캡처:', shot); }
} finally {
  await ctx.close().catch(() => {});
}
