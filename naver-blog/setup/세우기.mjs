// 카테고리 4대분류 11중분류를 세운다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림창: ' + d.type() + ' — ' + d.message().replace(/\s+/g, ' ').slice(0, 120)); await d.accept().catch(() => {}); });
pg.on('request', (r) => { if (r.method() === 'POST') P('POST → ' + r.url().slice(0, 110)); });
pg.on('response', (r) => { if (/CategoryUpdate/i.test(r.url())) P('응답 ' + r.status() + ' ' + r.url().slice(0, 100)); });
pg.on('console', (m) => { if (m.type() === 'error') P('콘솔오류: ' + m.text().slice(0, 120)); });
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=' + CFG.blogId, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
await saveCookies(ctx);

const tree = () => pg.evaluate(() => [...document.querySelectorAll('span._categoryName')].map((e) => e.innerText.trim()));
// 스팬을 클릭해도 트리 위젯은 선택을 안 바꾼다. 위젯에 직접 시킨다.
const pick = async (name) => {
  const ok = await pg.evaluate((n) => {
    const s = [...document.querySelectorAll('span._categoryName')].find((e) => (e.textContent || '').trim() === n);
    if (!s) return 'span 없음';
    const li = s.closest('li');
    try { window.tree.selectNode(li); } catch (e) { return 'selectNode 오류: ' + e; }
    const cur = window.tree.getSelectedNode();
    const curName = cur && cur.querySelector ? (cur.querySelector('span._categoryName') || {}).textContent : '';
    return (curName || '').trim() === n ? true : '선택 어긋남: ' + curName;
  }, name);
  await pg.waitForTimeout(500);
  if (ok !== true) { P('     선택 문제: ' + ok); return false; }
  return true;
};
const pickRoot = async () => {
  const el = pg.locator('li.tree-selected, li').filter({ hasText: '카테고리 전체보기' }).first();
  await el.click({ timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(400);
};
const makeNode = async (name) => {
  await pg.evaluate(() => window.category.createNode_new('B'));
  await pg.waitForTimeout(700);
  const box = pg.locator('#category_name');
  if (await box.isDisabled().catch(() => true)) return false;
  // 실제로 쳐 넣어야 onkeyup 이 돌면서 트리 이름이 바뀐다
  await box.click({ timeout: 8000 }).catch(() => {});
  await box.press('Meta+A').catch(() => {});
  await box.type(name, { delay: 25 });
  await pg.waitForTimeout(600);
  const names = await tree();
  return names.includes(name);
};

P('전:', (await tree()).join(' / '));
let made = 0;
for (const parent of CFG.카테고리) {
  const pname = `${parent.no} ${parent.name}`;
  await pickRoot();
  if (await makeNode(pname)) { made++; P('+ ' + pname); } else { P('✗ ' + pname); }
  for (const kid of parent.children) {
    const kname = `${kid.no} ${kid.name}`;
    if (!(await pick(pname))) { P('  부모 선택 실패: ' + pname); continue; }
    if (await makeNode(kname)) { made++; P('   + ' + kname); } else { P('   ✗ ' + kname); }
  }
}
P('후:', (await tree()).join(' / '));
P(made + '개 생성 — 저장합니다');
// 저장은 화면의 확인 버튼으로
const pre = await pg.evaluate(() => { try { return window.category.getJson().length; } catch (e) { return 'getJson 오류: ' + e; } });
P('보낼 데이터 길이: ' + pre);
const sent = await pg.evaluate(() => {
  try {
    const c = window.category;
    document.getElementById('updatedCategoryListStruct').value = c.getJson();
    document.getElementById('categoryGrantingChangeSet').value = c._buildCategoryGrantingChangeSet();
    const id = new URLSearchParams(location.search).get('blogId');
    const f = document.getElementById('frm');
    f.method = 'post';
    f.action = '/BlogCategoryUpdateAsync.naver?blogId=' + id;   // 화면이 실제로 쓰는 주소
    f.submit();
    return 'ok → ' + f.action;
  } catch (e) { return String(e); }
});
P('폼 전송: ' + sent);
await pg.waitForTimeout(9000);
await pg.screenshot({ path: '/tmp/aftersave.png', fullPage: true }).catch(() => {});
P('저장 후 주소: ' + pg.url());
await pg.screenshot({ path: '/tmp/saved.png', fullPage: true }).catch(() => {});
