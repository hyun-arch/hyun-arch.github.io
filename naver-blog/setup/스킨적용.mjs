import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
await pg.goto('https://admin.blog.naver.com/ianlove80/skin/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
const F = pg.frames().find((fr) => /NaverSkin/i.test(fr.url())) || pg.mainFrame();

const pick = await F.evaluate(() => {
  const r = document.getElementById('naverSkinListRadio8');
  if (!r) return '라디오 없음';
  const lab = document.querySelector('label[for="naverSkinListRadio8"]');
  r.click();
  if (lab) lab.click();
  r.checked = true;
  r.dispatchEvent(new Event('change', { bubbles: true }));
  r.dispatchEvent(new Event('click', { bubbles: true }));
  return 'checked=' + r.checked;
});
P('선택: ' + pick);
await pg.waitForTimeout(1200);

// 적용 버튼은 다른 프레임에 있을 수 있다 — 전부 뒤진다
let hit = '적용 버튼 못 찾음';
for (const fr of pg.frames()) {
  const r = await fr.evaluate(() => {
    const el = [...document.querySelectorAll('a,button,input')].find((e) => ((e.innerText || e.value || '').trim()) === '스킨 적용');
    if (!el) return null;
    el.click();
    return '눌렀음';
  }).catch(() => null);
  if (r) { hit = r + ' (' + (fr.url() || '메인').slice(-30) + ')'; break; }
}
P(hit);
await pg.waitForTimeout(8000);
P('지금: ' + pg.url().slice(0, 70));
await pg.screenshot({ path: '/tmp/skin.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
