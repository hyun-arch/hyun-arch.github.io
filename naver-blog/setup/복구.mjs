// 하위 카테고리를 제 부모 밑으로 되돌리고 번호 순서까지 맞춘다. 검사 통과 전에는 저장하지 않는다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const SAVE = process.argv.includes('--저장');
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);

const r = await pg.evaluate(() => {
  const find = (n) => [...document.querySelectorAll('span._categoryName')].find((e) => (e.textContent || '').trim() === n);
  const li = (n) => { const s = find(n); return s ? s.closest('li') : null; };
  const PLAN = [
    ['01 아람비즈니스', ['11 진단 이야기', '12 릴라이', '13 현장 기록']],
    ['02 여행', ['21 유럽', '22 아시아', '23 준비와 짐']],
    ['03 읽고 생각한 것', ['31 서재', '32 생각 조각']],
    ['04 함께하는 사람들', ['41 셀피쉬클럽', '42 스폰지클럽', '43 공유회']],
  ];
  const log = [];
  for (const [p, kids] of PLAN) {
    const pn = li(p);
    if (!pn) { log.push('부모 없음 ' + p); continue; }
    for (const k of kids) {
      const kn = li(k);
      if (!kn) { log.push('자식 없음 ' + k); continue; }
      try { window.tree.appendNode(pn, kn); log.push('○ ' + k + ' → ' + p); }   // (부모, 자식) 차례다
      catch (e) { log.push('✗ ' + k + ' : ' + String(e).slice(0, 40)); }
    }
  }
  return log;
});
for (const l of r) P('  ' + l);

const check = await pg.evaluate(() => {
  const j = JSON.parse(window.category.getJson()); const list = j.list || j;
  const byNo = {}; for (const c of list) byNo[c.categoryNo] = c.categoryName;
  return list.map((c) => `${c.listOrder}:${c.categoryName}${c.parentCategoryNo > 0 ? ' (부모 ' + byNo[c.parentCategoryNo] + ')' : ''}`);
});
P('저장될 모습:');
for (const c of check) P('   ' + c);

if (SAVE) {
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
  P('저장했습니다');
} else P('(검사만 — 저장 안 함)');
await ctx.close().catch(() => {});
