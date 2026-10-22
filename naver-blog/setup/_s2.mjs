import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto('https://admin.blog.naver.com/ianlove80/config/topmenu', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>{});
await pg.waitForTimeout(3000);
console.log(/nid\.naver\.com/.test(pg.url()) ? '세션 없음' : '세션 있음 → ' + pg.url());
