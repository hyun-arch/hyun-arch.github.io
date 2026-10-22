// 카테고리 계층과 순서를 직접 계산해 저장한다.
// 네이버는 categoryLevel 로 계층을 판단한다: 상위는 "00","01"…, 하위는 상위코드+"01","02"…
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const SAVE = process.argv.includes('--저장');
const PLAN = [
  ['01 아람비즈니스', ['11 진단 이야기', '12 릴라이', '13 현장 기록']],
  ['02 여행', ['21 유럽', '22 아시아', '23 준비와 짐']],
  ['03 읽고 생각한 것', ['31 서재', '32 생각 조각']],
  ['04 함께하는 사람들', ['41 셀피쉬클럽', '42 스폰지클럽', '43 공유회']],
];
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);

const built = await pg.evaluate((PLAN) => {
  const j = JSON.parse(window.category.getJson());
  const list = j.list || j;
  const by = {}; for (const c of list) by[c.categoryName] = c;
  const out = [];
  let order = 0;
  PLAN.forEach(([pname, kids], pi) => {
    const p = by[pname];
    if (!p) return;
    p.categoryLevel = String(pi).padStart(2, '0');
    p.parentCategoryNo = -1;
    p.depth = 0;
    p.hasChildren = kids.length > 0;
    p.listOrder = ++order;
    p.actionType = 2;
    out.push(p);
    kids.forEach((kname, ki) => {
      const k = by[kname];
      if (!k) return;
      k.categoryLevel = p.categoryLevel + String(ki + 1).padStart(2, '0');
      k.parentCategoryNo = p.categoryNo;
      k.parentCategoryListOrder = p.listOrder;
      k.depth = 1;
      k.hasChildren = false;
      k.listOrder = ++order;
      k.actionType = 2;
      out.push(k);
    });
  });
  const payload = Array.isArray(j) ? out : Object.assign({}, j, { list: out });
  window.__payload = JSON.stringify(payload);
  return out.map((c) => `${c.listOrder} ${c.categoryName} lv=${c.categoryLevel} parent=${c.parentCategoryNo}`);
}, PLAN);
P('보낼 내용:');
for (const b of built) P('   ' + b);

if (SAVE) {
  await pg.evaluate(() => {
    const id = new URLSearchParams(location.search).get('blogId');
    const f = document.getElementById('frm');
    document.getElementById('updatedCategoryListStruct').value = window.__payload;
    document.getElementById('categoryGrantingChangeSet').value = window.category._buildCategoryGrantingChangeSet();
    f.method = 'post';
    f.action = '/BlogCategoryUpdateAsync.naver?blogId=' + id;
    f.submit();
  });
  await pg.waitForTimeout(8000);
  P('저장했습니다');
} else P('(검사만)');
await ctx.close().catch(() => {});
