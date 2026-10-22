import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: true });
const ck = await ctx.cookies('https://www.naver.com').catch(() => []);
console.log(ck.some(c=>c.name==='NID_AUT')&&ck.some(c=>c.name==='NID_SES') ? '세션 살아있음' : '세션 없음');
await ctx.close().catch(()=>{});
