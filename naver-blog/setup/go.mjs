// 카테고리 만들기 — 관리 화면을 직접 찾아 들어가서 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
const P = (...a) => console.log('  ' + a.join(' '));

await pg.goto(`https://admin.blog.naver.com/${CFG.blogId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(3000);
for (const t of ['확인', '다시 보지 않기', '닫기']) {
  const b = pg.locator(`button:has-text("${t}"), a:has-text("${t}")`).first();
  if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(600); }
}

// 관리 화면 안의 링크를 모두 훑어 카테고리 관리로 가는 길을 찾는다
const all = await pg.evaluate(() => [...document.querySelectorAll('a[href]')]
  .map((a) => ({ t: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 24), h: a.href }))
  .filter((x) => x.t));
const cand = all.filter((x) => /카테고리|메뉴·글|메뉴 글|메뉴글/.test(x.t));
P('후보 링크:');
for (const c of cand.slice(0, 10)) P('   ', c.t, '→', c.h.replace('https://admin.blog.naver.com', ''));

let target = cand.find((c) => /카테고리/.test(c.t)) || cand[0];
if (target) {
  await pg.goto(target.h, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(3500);
}
P('현재:', pg.url());

// 화면 안에서 카테고리 관리 탭을 한 번 더 찾는다
for (const t of ['카테고리 관리', '카테고리관리', '블로그']) {
  const l = pg.locator(`a:has-text("${t}"), button:has-text("${t}")`).first();
  if (await l.isVisible().catch(() => false)) { await l.click().catch(() => {}); await pg.waitForTimeout(3000); P('클릭:', t); break; }
}
P('도착:', pg.url());
await pg.screenshot({ path: '/tmp/cat.png', fullPage: true }).catch(() => {});

const btns = await pg.evaluate(() => [...new Set([...document.querySelectorAll('button,a,input[type=button]')]
  .map((e) => (e.innerText || e.value || '').trim()).filter((t) => t && t.length < 18))]);
P('버튼:', btns.slice(0, 40).join(' | '));
fs.writeFileSync('/tmp/cat-buttons.json', JSON.stringify(btns, null, 1));
P('(창 열어 둡니다 · 스크린샷 /tmp/cat.png)');
