// 기존 카테고리의 글 목록을 읽는다 (유럽여행·파리·이탈리아·아시아여행·일본·중국)
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await saveCookies(ctx);
const CATS = [[1, '유럽여행'], [6, '파리'], [7, '이탈리아'], [9, '아시아여행'], [10, '일본'], [11, '중국']];
const out = {};
for (const [no, name] of CATS) {
  await pg.goto(`https://blog.naver.com/PostList.naver?blogId=ianlove80&categoryNo=${no}&from=postList&listStyle=list`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(3000);
  const items = await pg.evaluate(() => {
    const seen = [];
    for (const fr of [document, ...[...document.querySelectorAll('iframe')].map((f) => { try { return f.contentDocument; } catch { return null; } })]) {
      if (!fr) continue;
      for (const a of fr.querySelectorAll('a[href]')) {
        const m = a.href.match(/logNo=(\d+)/) || a.href.match(/blog\.naver\.com\/[^/]+\/(\d{9,})/);
        if (m) seen.push({ no: m[1], t: (a.innerText || '').trim() });
      }
    }
    return seen.filter((x) => x.t.length > 3);
  });
  const uniq = [...new Map(items.map((i) => [i.no, i])).values()];
  out[name] = uniq;
  P(`${name}(${no}) — ${uniq.length}개`);
  for (const i of uniq.slice(0, 25)) P('     ' + i.no + '  ' + i.t.replace(/\s+/g, ' ').slice(0, 42));
}
