import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto(`https://admin.blog.naver.com/${CFG.blogId}/config/blog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(4000);
await saveCookies(ctx);
P('주소:', pg.url());
const btns = await pg.evaluate(() => [...document.querySelectorAll('button,a,input[type=button],input[type=submit]')]
  .filter((b) => b.offsetParent !== null)
  .map((b) => ((b.innerText || b.value || '').trim()).slice(0, 16)).filter(Boolean));
P('버튼:', [...new Set(btns)].join(' | ').slice(0, 500));
const cats = await pg.evaluate(() => [...document.querySelectorAll('li,td')]
  .map((e) => (e.innerText || '').trim().split('\n')[0]).filter((t) => t && t.length < 18).slice(0, 30));
P('현재 카테고리로 보이는 것:', [...new Set(cats)].join(' · ').slice(0, 300));
await pg.screenshot({ path: '/tmp/blogcfg.png', fullPage: true }).catch(() => {});
