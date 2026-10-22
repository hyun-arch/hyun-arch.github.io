import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const INTRO = fs.readFileSync(path.join(HERE, '../assets/소개글.txt'), 'utf8').trim();
const PROFILE = path.resolve(HERE, '../assets/프로필.png');
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { P('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 90)); await d.accept().catch(() => {}); });
await pg.goto(`https://admin.blog.naver.com/${CFG.blogId}/config/bloginfo`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(8000);
await saveCookies(ctx);

// 소개글 textarea 가 있는 프레임을 고른다
let F = null;
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('textarea').length).catch(() => 0);
  if (n > 0) { F = fr; break; }
}
if (!F) { P('소개글 칸을 못 찾음'); await ctx.close(); process.exit(1); }
P('프레임: ' + (F.url() || '메인').slice(-46));

const before = await F.evaluate(() => (document.querySelector('textarea') || {}).value || '');
P('전 소개글: ' + before.slice(0, 50).replace(/\s+/g, ' '));

const ta = F.locator('textarea').first();
await ta.click({ timeout: 10000 });
await ta.fill(INTRO);
await pg.waitForTimeout(500);
P('후 소개글: ' + (await ta.inputValue()).slice(0, 50).replace(/\s+/g, ' '));

// 프로필 이미지
const file = F.locator('input[type=file]').first();
if (await file.count()) {
  await file.setInputFiles(PROFILE).catch((e) => P('이미지 실패: ' + e.message.slice(0, 50)));
  await pg.waitForTimeout(4000);
  P('프로필 이미지 올림');
}

// 저장
const ok = F.locator('a:has-text("확인"), button:has-text("확인"), input[value="확인"]').last();
await ok.click({ timeout: 15000 }).catch((e) => P('확인 실패: ' + e.message.slice(0, 50)));
await pg.waitForTimeout(7000);
P('저장 시도 완료 · ' + pg.url());
await pg.screenshot({ path: '/tmp/info2.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
