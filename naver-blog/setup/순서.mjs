// 카테고리를 번호 차례대로 정렬한다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);

const before = await pg.evaluate(() => [...document.querySelectorAll('span._categoryName')].map((s) => (s.textContent || '').trim()));
P('전: ' + before.join(' / '));

const moved = await pg.evaluate(() => {
  const data = window.tree.getNodeData();
  const num = (v) => { const m = String(v && v.text || '').trim().match(/^(\d+)/); return m ? Number(m[1]) : 9999; };
  let n = 0;
  // 부모 자체 순서
  const tops = data.filter(Boolean);
  tops.sort((x, y) => num(x) - num(y));
  // 자식 순서
  for (const v of tops) {
    if (v && v._children && v._children.length > 1) {
      const was = v._children.map(num).join(',');
      v._children.sort((x, y) => num(x) - num(y));
      if (was !== v._children.map(num).join(',')) n++;
    }
  }
  return n + '개 묶음 정렬 · 상위 ' + tops.map((t) => String(t.text).trim().slice(0, 6)).join('>');
});
P(moved);

const after = await pg.evaluate(() => {
  const j = JSON.parse(window.category.getJson()); const list = j.list || j;
  return list.map((c) => c.listOrder + ':' + c.categoryName).join(' / ');
});
P('저장될 순서: ' + after);

await pg.evaluate(() => {
  const id = new URLSearchParams(location.search).get('blogId');
  const f = document.getElementById('frm');
  document.getElementById('updatedCategoryListStruct').value = window.category.getJson();
  document.getElementById('categoryGrantingChangeSet').value = window.category._buildCategoryGrantingChangeSet();
  f.method = 'post';
  f.action = '/BlogCategoryUpdateAsync.naver?blogId=' + id;
  f.submit();
});
await pg.waitForTimeout(8000);
P('끝');
await ctx.close().catch(() => {});
