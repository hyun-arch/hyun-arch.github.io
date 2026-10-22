// 남은 글들을 제 카테고리로 보낸다. 창은 하나만 쓰고 끝까지 간다.
import fs from 'node:fs';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const LOG = '/tmp/fin.log';
const P = (...a) => { const s = '  ' + a.join(' '); console.log(s); try { fs.appendFileSync(LOG, s + '\n'); } catch {} };
const JOBS = [
  ['224179139313', 23, '21 유럽', '베니스 여행'],
  ['224177801301', 23, '21 유럽', '피렌체 자유여행'],
  ['224174405767', 23, '21 유럽', '베네치아돌로미티투어 후기'],
  ['224174388604', 23, '21 유럽', '베네치아돌로미티투어'],
  ['224167540739', 23, '21 유럽', '출장자용 파리'],
];
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await saveCookies(ctx);
let dumped = false, ok = 0;

for (const [logNo, catNo, label, short] of JOBS) {
  try {
    await pg.goto(`https://blog.naver.com/PostUpdateForm.naver?blogId=ianlove80&logNo=${logNo}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(5000);
    const f = pg.frames().find((fr) => /PostWriteForm|postwrite|PostUpdate/i.test(fr.url())) || pg.mainFrame();
    for (let t = 0; t < 10; t++) {
      const pop = f.locator('.se-popup-alert-confirm').first();
      if (!(await pop.isVisible().catch(() => false))) { await pg.waitForTimeout(500); continue; }
      await pop.locator('button:has-text("취소")').first().click({ force: true }).catch(() => {});
      await pg.waitForTimeout(900);
    }
    await f.locator('.se-popup-dim').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await f.locator('button[class*="publish_btn"]:visible').first().click({ timeout: 25000 });
    await f.locator('button[class*="confirm_btn"]:visible').first().waitFor({ state: 'visible', timeout: 20000 });
    await f.locator('button[class*="selectbox_button"]:visible').first().click({ timeout: 10000 }).catch(() => {});
    await pg.waitForTimeout(1200);

    if (!dumped) {
      const html = await f.evaluate((no) => {
        const r = [...document.querySelectorAll('input[type=radio]')].find((i) => i.id.startsWith(no + '_'));
        return r ? (r.closest('li') || r.parentElement).outerHTML.slice(0, 700) : '라디오 없음';
      }, String(catNo));
      P('구조: ' + html.replace(/\s+/g, ' '));
      dumped = true;
    }

    // 항목마다 data-testid 가 붙어 있다. 라벨 글자를 누르고, 결과는 선택상자 글자로 확인한다.
    const shown = () => f.evaluate(() => {
      const b = [...document.querySelectorAll('button[class*="selectbox_button"]')].find((e) => e.offsetParent !== null);
      return b ? (b.innerText || '').replace(/\s+/g, ' ').replace('하위 카테고리 ', '').trim() : '없음';
    });
    P(`  ${short} — 지금 "${await shown()}"`);
    let done = false;
    for (const sel of [`[data-testid="categoryItemText_${catNo}"]`, `label[for="${catNo}_${label}"]`, `[data-testid="categoryBtn_${catNo}"]`]) {
      await f.locator(sel).first().click({ timeout: 6000, force: true }).catch(() => {});
      await pg.waitForTimeout(900);
      const now = await shown();
      if (now === label) { P(`  ${short} — 선택됨 (${sel.slice(0, 32)})`); done = true; break; }
    }
    if (!done) { P(`  ${short} ✗ 선택 안 됨 (지금 "${await shown()}")`); await pg.screenshot({ path: `/tmp/f-${logNo}.png` }).catch(() => {}); continue; }

    await f.locator('button[class*="confirm_btn"]:visible').first().click({ timeout: 20000 });
    await pg.waitForTimeout(7000);
    ok++;
    P(`  ${short} → ${label} 발행 완료`);
  } catch (e) {
    P(`  ${short} ✗ ${e.message.slice(0, 60)}`);
  }
}
P(`이동 ${ok}/${JOBS.length}`);

// 빈 옛 카테고리 정리
if (ok === JOBS.length) {
  await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(3500);
  const removed = await pg.evaluate(() => {
    const j = JSON.parse(window.category.getJson()); const list = j.list || j;
    const dead = ['유럽여행', '파리', '이탈리아', '아시아여행', '일본', '중국', '구분선'];
    const names = [...document.querySelectorAll('span._categoryName')].map((s) => s.closest('li'));
    let n = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      if (!dead.includes(c.categoryName)) continue;
      if ((c.postCount || 0) > 0) continue;
      const li = names[i];
      if (!li) continue;
      try { window.tree.selectNode(li); window.category.removeNode(); n++; } catch {}
    }
    return n;
  });
  P('빈 옛 카테고리 ' + removed + '개 삭제');
  await pg.evaluate(() => {
    const id = new URLSearchParams(location.search).get('blogId');
    const f = document.getElementById('frm');
    document.getElementById('updatedCategoryListStruct').value = window.category.getJson();
    document.getElementById('categoryGrantingChangeSet').value = window.category._buildCategoryGrantingChangeSet();
    f.method = 'post';
    f.action = '/BlogCategoryUpdateAsync.naver?blogId=' + id;
    f.submit();
  });
  await pg.waitForTimeout(7000);
  P('카테고리 저장 완료');
}
P('모두 끝');

// 끝났으면 창을 닫는다
await ctx.close().catch(() => {});
