// 계획대로 글의 카테고리를 바꾼다.
import fs from 'node:fs';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => { const s = '  ' + a.join(' '); console.log(s); try { fs.appendFileSync('/tmp/move.log', s + '\n'); } catch {} };
const plan = JSON.parse(fs.readFileSync('/tmp/plan.json', 'utf8'));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await saveCookies(ctx);
let ok = 0;
for (const job of plan) {
  const want = job.label;   // "21 유럽" — 부분일치로 "유럽여행" 을 집지 않도록 통째로 쓴다
  try {
    await pg.goto(`https://blog.naver.com/PostUpdateForm.naver?blogId=ianlove80&logNo=${job.no}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
    const confirm = f.locator('button[class*="confirm_btn"]:visible').first();
    await confirm.waitFor({ state: 'visible', timeout: 20000 });
    await f.locator('button[class*="selectbox_button"]:visible').first().click({ timeout: 10000 }).catch(() => {});
    await pg.waitForTimeout(900);
    // 라디오 id 는 "<네이버카테고리번호>_<이름>" 이다. 그걸 직접 누른다.
    const clicked = await f.evaluate((no) => {
      const r = [...document.querySelectorAll('input[type=radio]')].find((i) => i.id.startsWith(no + '_'));
      if (!r) return null;
      r.click();
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
      return r.id;
    }, String(job.to));
    if (!clicked) throw new Error(`카테고리 ${job.to} 라디오 없음`);
    await pg.waitForTimeout(700);
    const now = await f.evaluate(() => {
      const c = [...document.querySelectorAll('input[type=radio]:checked')].map((i) => i.id).filter((x) => /^\d+_/.test(x));
      return c[0] || '없음';
    });
    if (!now.startsWith(String(job.to) + '_')) throw new Error('선택 안 바뀜: ' + now);
    await confirm.click({ timeout: 20000 });
    await pg.waitForTimeout(6500);
    ok++;
    P(`${job.no} → ${job.label}   ${job.t.slice(0, 26)}`);
  } catch (e) {
    P(`${job.no} ✗ ${e.message.slice(0, 50)}   ${job.t.slice(0, 26)}`);
  }
}
P(`끝. ${ok}/${plan.length}개 이동.`);
