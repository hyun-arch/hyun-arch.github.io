import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/Remocon.naver?blogId=ianlove80&loadType=admin&Redirect=Remocon&SelectedMenu=title', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(9000);
const r = await pg.evaluate(() => {
  const panel = document.getElementById('content_menu1');
  if (!panel) return '패널 없음';
  return [...panel.querySelectorAll('input')].map((i) => ({ t: i.type, id: i.id, cls: (i.className || '').slice(0, 30), v: (i.value || '').slice(0, 10) }));
});
P(JSON.stringify(r).slice(0, 700));
await ctx.close().catch(() => {});
