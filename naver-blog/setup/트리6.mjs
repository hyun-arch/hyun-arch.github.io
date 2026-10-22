import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/AdminCategoryView.naver?blogId=ianlove80', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3500);
const tree = () => pg.evaluate(() => [...document.querySelectorAll('span._categoryName')].map((e) => e.innerText.trim()));
P('전:', (await tree()).join(' / '));
const r = await pg.evaluate(() => {
  try {
    const before = window.category.createNode_user.length;
    window.category.createNode_user();
    return { ok: true, arity: before };
  } catch (e) { return { ok: false, err: String(e) }; }
});
P('createNode_user:', JSON.stringify(r));
await pg.waitForTimeout(1200);
P('후:', (await tree()).join(' / '));
const inp = await pg.evaluate(() => {
  const i = document.getElementById('category_name');
  return { disabled: i.disabled, value: i.value };
});
P('이름칸:', JSON.stringify(inp));
if (!inp.disabled) {
  await pg.evaluate(() => {
    const i = document.getElementById('category_name');
    i.value = '01 아람비즈니스';
    if (typeof window.onKeyUp === 'function') window.onKeyUp(i.value);
    i.dispatchEvent(new Event('keyup', { bubbles: true }));
  });
  await pg.waitForTimeout(800);
  P('이름 넣은 뒤:', (await tree()).join(' / '));
}
await pg.screenshot({ path: '/tmp/t6.png' }).catch(() => {});
