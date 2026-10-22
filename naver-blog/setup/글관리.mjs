import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
const probe = async (u) => {
  await pg.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await pg.waitForTimeout(2200);
  const bad = await pg.locator('a:has-text("이전 화면으로")').first().isVisible().catch(() => false);
  const has = await pg.evaluate(() => /이동|카테고리 이동/.test(document.body.innerText) && document.querySelectorAll('input[type=checkbox]').length > 2);
  P((bad ? '✗' : has ? '○ 글목록' : '△') + '  ' + u.replace('https://', ''));
  return !bad && has;
};
await saveCookies(ctx);
for (const u of [
  'https://admin.blog.naver.com/ianlove80/manage/post',
  'https://admin.blog.naver.com/PostManage.naver?blogId=ianlove80',
  'https://blog.naver.com/PostList.naver?blogId=ianlove80&categoryNo=0&from=postList',
  'https://admin.blog.naver.com/ianlove80/config/postexport',
  'https://blog.naver.com/ianlove80?Redirect=Manage',
]) { if (await probe(u)) { P('→ 여기서 진행'); break; } }
await pg.screenshot({ path: '/tmp/pm.png', fullPage: true }).catch(() => {});
