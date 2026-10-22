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

// 본문은 iframe 안에 있다 — 카테고리 추가 버튼이 있는 프레임을 찾는다
let F = null;
for (const fr of pg.frames()) {
  const n = await fr.locator('a:has-text("카테고리 추가"), button:has-text("카테고리 추가")').count().catch(() => 0);
  P('프레임', (fr.url() || '(이름없음)').slice(-40), '버튼', n);
  if (n > 0) { F = fr; break; }
}
if (!F) { P('카테고리 추가 버튼이 있는 프레임을 못 찾음'); process.exit(1); }

const tree = async () => F.evaluate(() => {
  const root = [...document.querySelectorAll('*')].find((e) => /카테고리 전체보기/.test(e.innerText || '') && e.children.length < 40);
  return root ? (root.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean) : [];
});
P('지금:', (await tree()).join(' / '));

const add = F.locator('a:has-text("카테고리 추가"), button:has-text("카테고리 추가")').first();
await add.click({ timeout: 15000 });
await pg.waitForTimeout(1200);
P('추가 후:', (await tree()).join(' / '));

const nameBox = F.locator('input[type=text]:visible').first();
const boxes = await F.locator('input[type=text]:visible').count();
P('보이는 입력칸 수:', boxes);
await nameBox.fill('01 아람비즈니스').catch((e) => P('입력 실패', e.message));
await pg.waitForTimeout(1000);
P('이름 넣은 뒤:', (await tree()).join(' / '));
await pg.screenshot({ path: '/tmp/tree.png', fullPage: false }).catch(() => {});
