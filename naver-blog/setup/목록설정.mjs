import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
// 첫 카테고리를 골라 설정 영역을 활성화
await pg.evaluate(() => { const s = document.querySelector('span._categoryName'); if (s) window.tree.selectNode(s.closest('li')); });
await pg.waitForTimeout(1200);
const r = await pg.evaluate(() => ({
  radios: [...document.querySelectorAll('input[type=radio]')].filter((i) => !/directorySeq|openYn|pagesizeView/.test(i.name)).map((i) => ({ id: i.id, name: i.name, v: i.value, on: i.checked, lab: ((document.querySelector('label[for="' + i.id + '"]') || {}).innerText || '').trim() })).slice(0, 20),
  selects: [...document.querySelectorAll('select')].map((s) => ({ id: s.id, v: s.value, opts: [...s.options].map((o) => o.value + ':' + o.text).slice(0, 6) })),
}));
P('라디오: ' + JSON.stringify(r.radios).slice(0, 800));
P('셀렉트: ' + JSON.stringify(r.selects).slice(0, 300));
await ctx.close().catch(() => {});
