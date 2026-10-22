import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/skin/list', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
let F = pg.mainFrame();
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('input[type=radio]').length).catch(() => 0);
  if (n > 3) { F = fr; break; }
}
P('프레임: ' + (F.url() || '메인').slice(-45));
const r = await F.evaluate(() => ({
  skins: [...document.querySelectorAll('input[type=radio]')].map((i) => {
    const li = i.closest('li,td,div');
    return { id: i.id, v: i.value, checked: i.checked, name: li ? (li.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 18) : '' };
  }).slice(0, 40),
  btns: [...new Set([...document.querySelectorAll('a,button,input[type=submit]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || '').trim()).filter((t) => t && t.length < 14))],
}));
P('스킨 ' + r.skins.length + '개');
for (const s of r.skins) P('   ' + (s.checked ? '●' : '○') + ' ' + (s.v || s.id).padEnd(16) + s.name);
P('버튼: ' + r.btns.join(' | ').slice(0, 160));
await ctx.close().catch(() => {});
