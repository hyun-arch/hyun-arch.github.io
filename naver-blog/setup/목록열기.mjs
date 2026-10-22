// 모든 카테고리에 "목록열기"(5줄)를 켠다. 창은 띄우지 않는다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);

// 먼저 "카테고리 전체보기"(루트) 부터 켠다 — 블로그 첫 화면이 이걸 쓴다
const root = await pg.evaluate(() => {
  const li = [...document.querySelectorAll('li')].find((e) => /카테고리 전체보기/.test(e.innerText || '') && e.querySelectorAll('li').length === 0);
  const target = li || [...document.querySelectorAll('li')].find((e) => /카테고리 전체보기/.test(e.innerText || ''));
  if (!target) return '루트 못 찾음';
  window.tree.selectNode(target);
  const open = document.getElementById('pub_c6');
  const sel = document.getElementById('topListPostCount');
  if (open && !open.checked) { open.click(); open.checked = true; open.dispatchEvent(new Event('change', { bubbles: true })); }
  if (sel) { sel.value = '5'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  return '전체보기 → ' + (open ? open.checked : '설정칸 없음');
});
P(root);
await pg.waitForTimeout(600);

const count = await pg.evaluate(() => document.querySelectorAll('span._categoryName').length);
P('카테고리 ' + count + '개');
let on = 0;
for (let i = 0; i < count; i++) {
  const r = await pg.evaluate((idx) => {
    const spans = [...document.querySelectorAll('span._categoryName')];
    const li = spans[idx] && spans[idx].closest('li');
    if (!li) return null;
    window.tree.selectNode(li);
    const open = document.getElementById('pub_c6');       // 목록열기
    const sel = document.getElementById('topListPostCount');
    if (open && !open.checked) { open.click(); open.checked = true; open.dispatchEvent(new Event('change', { bubbles: true })); }
    if (sel) { sel.value = '5'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    return (spans[idx].textContent || '').trim() + ' → ' + (open ? open.checked : '없음');
  }, i);
  if (r) { on++; P('  ' + r); }
  await pg.waitForTimeout(350);
}
P(on + '개 설정 — 저장');
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
