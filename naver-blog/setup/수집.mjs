// 카테고리별 글 목록을 네이버 내부 API 로 모은다.
import fs from 'node:fs';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://blog.naver.com/ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(2500);
await saveCookies(ctx);
const CATS = [[1, '유럽여행'], [6, '파리'], [7, '이탈리아'], [9, '아시아여행'], [10, '일본'], [11, '중국']];
const all = {};
for (const [no, name] of CATS) {
  const rows = [];
  for (let page = 1; page <= 4; page++) {
    const txt = await pg.evaluate(async ({ no, page }) => {
      const r = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=ianlove80&viewdate=&currentPage=${page}&categoryNo=${no}&parentCategoryNo=&countPerPage=30`, { credentials: 'include' });
      return r.text();
    }, { no, page });
    let j; try { j = JSON.parse(txt.replace(/^﻿/, '')); } catch { break; }
    const list = j.postList || [];
    for (const p of list) rows.push({ no: p.logNo, t: decodeURIComponent(p.title || '').replace(/\+/g, ' ') });
    if (list.length < 30) break;
  }
  all[name] = rows;
  P(`${name}(${no}) ${rows.length}개`);
  for (const r of rows.slice(0, 30)) P('     ' + r.no + '  ' + r.t.slice(0, 44));
}
fs.writeFileSync('/tmp/oldposts.json', JSON.stringify(all, null, 1));
