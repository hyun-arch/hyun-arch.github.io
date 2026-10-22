// 카테고리 관리 화면을 찾아 들어가 15개를 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());

// 블로그 관리 → 메뉴·글·동영상 관리 안에 카테고리 설정이 있다
for (const u of [
  `https://admin.blog.naver.com/${CFG.blogId}/config/category`,
  `https://admin.blog.naver.com/${CFG.blogId}/config/menu/category`,
  `https://admin.blog.naver.com/${CFG.blogId}/config/blog`,
  `https://admin.blog.naver.com/${CFG.blogId}/config/topmenu`,
]) {
  await pg.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(2500);
  const bad = await pg.locator('a:has-text("이전 화면으로")').first().isVisible().catch(() => false);
  P(u.split('/').slice(-2).join('/'), bad ? '✗ 오류쪽' : '○ 열림');
  if (!bad) {
    const links = await pg.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map((a) => ({ t: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 20), h: a.getAttribute('href') }))
      .filter((x) => x.t && x.h));
    const cat = links.filter((l) => /카테고리/.test(l.t));
    P('  카테고리 링크:', cat.map((c) => c.t + '→' + c.h).join(' , ').slice(0, 300) || '없음');
    const menus = links.filter((l) => /config|manage/i.test(l.h)).slice(0, 20);
    P('  설정 링크:', menus.map((c) => c.t + '→' + c.h.replace(/^https?:\/\/[^/]+/, '')).join(' , ').slice(0, 500));
    await pg.screenshot({ path: '/tmp/cfg.png', fullPage: true }).catch(() => {});
    break;
  }
}
