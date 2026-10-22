// 하위 카테고리를 번호 순으로 맞춘다. 번호 작은 것부터 "맨아래"로 보내면 정렬된다.
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70)); await d.accept().catch(() => {}); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('저장 응답 ' + r.status()); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);

const names = await pg.evaluate(() => [...document.querySelectorAll('span._categoryName')].map((s) => (s.textContent || '').trim()));
P('전: ' + names.join(' / '));

// 번호 오름차순으로 전부 맨아래 보내기 (상위·하위 모두)
const order = [...names].sort((a, b) => (parseInt(a) || 9999) - (parseInt(b) || 9999));
for (const nm of order) {
  const sel = await pg.evaluate((n) => {
    const s = [...document.querySelectorAll('span._categoryName')].find((e) => (e.textContent || '').trim() === n);
    if (!s) return false;
    window.tree.selectNode(s.closest('li'));
    return true;
  }, nm);
  if (!sel) { P('  ' + nm + ' 못 찾음'); continue; }
  await pg.waitForTimeout(200);
  // 합성 클릭은 안 먹는다 — 실제 마우스로 누른다
  const btn = pg.locator('._moveLast, img[alt="맨아래"]').first();
  await btn.click({ timeout: 6000, force: true }).catch((e) => P('  ' + nm + ' 클릭 실패 ' + e.message.slice(0, 30)));
  await pg.waitForTimeout(300);
}

const after = await pg.evaluate(() => [...document.querySelectorAll('span._categoryName')].map((s) => (s.textContent || '').trim()));
P('후: ' + after.join(' / '));

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
