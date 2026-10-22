// 같은 부모 밑 같은 이름이 둘이면 자식 없는 쪽을 지운다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 80)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
await saveCookies(ctx);

const plan = await pg.evaluate(() => {
  const j = JSON.parse(window.category.getJson()); const list = j.list || j;
  const kids = {};
  for (const c of list) kids[c.parentCategoryNo] = (kids[c.parentCategoryNo] || 0) + 1;
  const seen = {}, kill = [];
  for (const c of list) {
    const key = c.parentCategoryNo + '|' + c.categoryName;
    if (c.categoryName === '구분선') continue;
    if (seen[key] === undefined) { seen[key] = c; continue; }
    // 둘 중 자식 없는 쪽을 버린다
    const prev = seen[key];
    const drop = (kids[c.categoryNo] || 0) === 0 ? c : prev;
    if (drop === prev) seen[key] = c;
    kill.push({ no: drop.categoryNo, n: drop.categoryName });
  }
  return kill;
});
P('지울 것 ' + plan.length + '개: ' + plan.map((x) => x.no + ' ' + x.n).join(' , '));

for (const k of plan) {
  const ok = await pg.evaluate((no) => {
    const lis = [...document.querySelectorAll('li')].filter((li) => li.querySelector(':scope > * span._categoryName, :scope span._categoryName'));
    const j = JSON.parse(window.category.getJson()); const list = j.list || j;
    const idx = list.findIndex((c) => c.categoryNo === no);
    const nodes = [...document.querySelectorAll('span._categoryName')].map((s) => s.closest('li'));
    const li = nodes[idx];
    if (!li) return 'li 못찾음 idx' + idx;
    window.tree.selectNode(li);
    try { window.category.removeNode(); } catch (e) { return 'removeNode 오류 ' + e; }
    return true;
  }, k.no);
  await pg.waitForTimeout(700);
  P('  ' + k.no + ' ' + k.n + ' → ' + ok);
}

const left = await pg.evaluate(() => { const j = JSON.parse(window.category.getJson()); return (j.list || j).length; });
P('남은 노드 ' + left + '개 — 저장');
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
