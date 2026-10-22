import fs from 'node:fs';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(2500);
await saveCookies(ctx);
const rows = [];
for (let page = 1; page <= 5; page++) {
  const r = await pg.evaluate(async (pageNo) => {
    const u = 'https://blog.naver.com/PostTitleListAsync.naver?blogId=ianlove80&viewdate=&currentPage=' + pageNo + '&categoryNo=0&parentCategoryNo=&countPerPage=30';
    const res = await fetch(u, { credentials: 'include' });
    const t = await res.text();
    // JSON 이 깨져 오는 경우가 있어 정규식으로 뽑는다
    const list = [];
    const re = /"logNo"\s*:\s*"(\d+)"[\s\S]{0,400}?"title"\s*:\s*"([^"]*)"[\s\S]{0,200}?"categoryNo"\s*:\s*"(\d+)"/g;
    let m;
    while ((m = re.exec(t))) list.push({ logNo: m[1], title: m[2], categoryNo: m[3] });
    return { code: (t.match(/"resultCode"\s*:\s*"(\w)"/) || [])[1], n: list.length, list };
  }, page);
  P(`페이지 ${page}: ${r.code} ${r.n ?? ''}건 ${r.raw || ''}`);
  if (!r.list || !r.list.length) break;
  for (const p of r.list) rows.push({ no: p.logNo, cat: p.categoryNo, t: decodeURIComponent((p.title || '').replace(/\+/g, ' ')) });
  if (r.list.length < 30) break;
}
P('모은 글 ' + rows.length + '개');
const byCat = {};
for (const r of rows) (byCat[r.cat] ||= []).push(r);
for (const [c, list] of Object.entries(byCat)) {
  P(`  카테고리 ${c} — ${list.length}개`);
  for (const r of list) P('      ' + r.no + '  ' + r.t.slice(0, 46));
}
fs.writeFileSync('/tmp/posts.json', JSON.stringify(rows, null, 1));
await ctx.close().catch(() => {});
