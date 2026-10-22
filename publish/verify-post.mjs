#!/usr/bin/env node
// 글이 실제로 올라갔는지 확인한다.
//
//   node publish/verify-post.mjs <채널> [찾을말]
//   채널: linkedin | threads | instagram
//
// 왜 따로 만들었나 (2026-10-20 실측):
//   「글이 올라갔나」를 문자열 검색으로만 확인하다 세 번 틀렸다.
//     · 검색량 파일에 키워드가 없길래 「검색량 0」이라 결론 → 그 파일이 소비자 전용이었다
//     · 스레드가 오류로 끝나길래 「아무것도 안 올라감」이라 결론 → 3편 올라가 있었다
//     · 링크드인 본문에 「스폰지클럽」이 없길래 「미게시」라 결론
//       → 구글 번역이 켜져 영어로 바뀌어 있었다
//   셋 다 「도구가 못 찾은 것」을 「존재하지 않는 것」으로 읽었다.
//
// 그래서 이 도구는 두 가지를 지킨다.
//   1. 글 「개수」를 먼저 센다 — 내용 검색보다 먼저
//   2. 0건이면 화면을 캡처해 둔다 — 눈으로 봐야 결론을 낸다
import { openSns } from './web-login.mjs';

const CH = {
  linkedin: { url: 'https://www.linkedin.com/in/me/recent-activity/shares/',
              count: () => document.querySelectorAll('[data-urn*="activity"]').length },
  threads:  { url: 'https://www.threads.com/',
              count: () => document.querySelectorAll('[data-pressable-container]').length },
  instagram:{ url: 'https://www.instagram.com/',
              count: () => document.querySelectorAll('article a[href*="/p/"]').length },
};

const name = process.argv[2];
const needle = process.argv[3] || '';
const ch = CH[name];
if (!ch) { console.log('채널: linkedin | threads | instagram'); process.exit(1); }

const ctx = await openSns({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  await pg.setViewportSize({ width: 1100, height: 1400 });
  await pg.goto(ch.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(8000);

  const n = await pg.evaluate(ch.count).catch(() => -1);
  console.log(`  글 개수: ${n}`);

  if (needle) {
    const body = await pg.evaluate(() => document.body.innerText || '');
    const hit = body.includes(needle);
    console.log(`  「${needle}」 포함: ${hit ? '있음' : '없음'}`);
    if (!hit && n > 0) {
      console.log('  ⚠ 글은 있는데 검색어가 안 걸립니다.');
      console.log('    번역이 켜져 있거나 표현이 다를 수 있습니다 — 캡처를 눈으로 보세요.');
    }
  }

  if (n <= 0 || (needle && !(await pg.evaluate((s) => (document.body.innerText||'').includes(s), needle)))) {
    const shot = `/tmp/verify-${name}-${Date.now()}.png`;
    await pg.screenshot({ path: shot });
    console.log(`  캡처: ${shot}`);
    console.log('  → 이 캡처를 보기 전에는 「없다」고 결론 내지 않습니다.');
  }
} finally { await ctx.close().catch(() => {}); }
