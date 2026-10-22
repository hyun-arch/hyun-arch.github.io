#!/usr/bin/env node
// 에디터 안의 파일 입력칸과 사진 버튼이 어떻게 생겼는지 본다. 아무것도 누르지 않는다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';
const blogId = env().NAVER_BLOG_ID;
const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto(`https://blog.naver.com/${blogId}/postwrite`, { waitUntil:'domcontentloaded', timeout:60000 });
  await pg.waitForTimeout(6000);
  for (const fr of pg.frames()) {
    const info = await fr.evaluate(() => {
      const inputs = [...document.querySelectorAll('input[type=file]')].map(i => ({
        id: i.id, name: i.name, accept: i.accept, cls: i.className,
        hidden: getComputedStyle(i).display === 'none' || i.hidden,
      }));
      const photo = [...document.querySelectorAll('button, a')]
        .filter(b => /사진|이미지/.test(b.innerText || ''))
        .slice(0, 6)
        .map(b => ({ text: (b.innerText||'').trim().slice(0,20), cls: b.className.slice(0,70), tag: b.tagName }));
      return { inputs, photo };
    }).catch(() => null);
    if (info && (info.inputs.length || info.photo.length))
      console.log(JSON.stringify({ frame: fr.url().slice(0,70), ...info }, null, 1));
  }
} finally { await ctx.close().catch(()=>{}); }
