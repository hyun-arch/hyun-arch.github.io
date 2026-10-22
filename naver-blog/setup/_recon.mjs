import fs from 'node:fs';
import { openBrowser } from '../../publish/naver-open.mjs';
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
for (const u of ['https://admin.blog.naver.com/ianlove80/config/category',
                 'https://admin.blog.naver.com/ianlove80/config/menu']) {
  await pg.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>{});
  await pg.waitForTimeout(2500);
  console.log('\n요청:', u.split('/').pop(), '→ 도착:', pg.url());
  const info = await pg.evaluate(() => ({
    btns: [...document.querySelectorAll('button,a,input[type=button]')].map(e=>(e.innerText||e.value||'').trim()).filter(t=>t&&t.length<20),
    inputs: [...document.querySelectorAll('input[type=text]')].map(i=>({n:i.name||i.id, v:i.value})),
    frames: [...document.querySelectorAll('iframe')].map(f=>f.src),
  })).catch(()=>({}));
  console.log('버튼:', [...new Set(info.btns||[])].slice(0,30).join(' | '));
  console.log('입력칸:', JSON.stringify(info.inputs||[]).slice(0,300));
  console.log('iframe:', (info.frames||[]).join(' , ').slice(0,200));
  await pg.screenshot({ path: `/tmp/r-${u.split('/').pop()}.png` }).catch(()=>{});
}
