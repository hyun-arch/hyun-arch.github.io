#!/usr/bin/env node
// 네이버 글쓰기 창을 열어 준다.
//
//   node publish/naver-open.mjs          # 창만 열기(처음 한 번 로그인용)
//
// 이 파일은 비밀번호도 쿠키도 읽지 않는다. 그냥 전용 크롬 프로필로 브라우저를 띄울 뿐이고,
// 로그인 상태는 그 브라우저가 평소 크롬처럼 자기 프로필 폴더에 알아서 들고 있는다.
// (프로필 폴더: publish/.browser — git 제외)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROFILE = path.join(HERE, '.browser');

// 네이버의 NID_SES 는 세션 쿠키라 크롬이 디스크에 안 적는다.
// 그래서 우리가 직접 들고 있다가 띄울 때 도로 넣어 준다. 이게 없으면 창을 닫을 때마다 로그인이 풀린다.
export const COOKIES = path.join(HERE, '.naver-cookies.json');

export async function saveCookies(ctx) {
  try {
    const all = await ctx.cookies();
    const mine = all.filter((c) => /naver\.com$/.test(c.domain.replace(/^\./, '')));
    if (mine.length) fs.writeFileSync(COOKIES, JSON.stringify(mine, null, 1));
    return mine.length;
  } catch { return 0; }
}

export async function openBrowser({ headless = false } = {}) {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless,
    locale: 'ko-KR',
    viewport: { width: 1360, height: 950 },
    args: ['--disable-blink-features=AutomationControlled', '--restore-last-session'],
  });
  if (fs.existsSync(COOKIES)) {
    try { await ctx.addCookies(JSON.parse(fs.readFileSync(COOKIES, 'utf8'))); } catch {}
  }
  return ctx;
}

// 경로에 한글이나 괄호가 있으면 import.meta.url 이 퍼센트 인코딩돼서
// 단순 문자열 비교가 어긋난다. 실제 경로로 바꿔서 견준다.
const isMain = (() => {
  try { return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || ''); }
  catch { return false; }
})();
if (isMain) {
  const ctx = await openBrowser({ headless: false });
  // 주기 저장 — 창이 갑자기 죽어도 로그인이 남게 (2026-10-20: pkill 로 죽여 로그인이 날아갔다)
  const 저장루프 = setInterval(() => { saveCookies(ctx).catch(() => {}); }, 15000);
  process.on('SIGTERM', async () => { await saveCookies(ctx).catch(()=>{}); process.exit(0); });
  process.on('SIGINT',  async () => { await saveCookies(ctx).catch(()=>{}); process.exit(0); });
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.goto('https://nid.naver.com/nidlogin.login?url=https%3A%2F%2Fblog.naver.com%2Fianlove80');
  console.log('\n  ────────────────────────────────────────');
  console.log('   브라우저를 띄웠습니다. 네이버에 로그인만 해주세요.');
  console.log('   (한 번만 하면 됩니다. 비밀번호는 저장하지 않습니다.)');
  console.log('   로그인 끝나면 창은 그대로 두세요 — 제가 이어서 씁니다.');
  console.log('  ────────────────────────────────────────\n');
  console.log('  다 되면 발행해 보세요:  node publish/post.mjs --text "첫 글" --to naver\n');
}
