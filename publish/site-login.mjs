#!/usr/bin/env node
// 사이트 관리자(카페24 · 워드프레스)에 로그인할 전용 브라우저를 띄운다.
//
//   node publish/site-login.mjs
//
// 왜 이렇게 하나 —
//   사람이 쓰는 크롬은 내가 조작할 수 없다(크롬이 막고, 저장된 로그인은 건드리면 안 된다).
//   그래서 네이버·SNS 때와 같은 방식으로, **내 전용 프로필 브라우저**를 띄우고
//   거기서 한 번만 로그인해 주면 그다음부터는 내가 직접 들어간다.
//
// 비밀번호도 쿠키도 내가 읽지 않는다. 그 브라우저가 자기 폴더에 들고 있는다.
// 프로필 폴더: publish/.browser-site  (git 제외)
//
// 알아낸 것 (2026-10-23) —
//   릴라이(lilai.ai) · 엘라피엘(ellapiel.co.kr) · 메디커스텀(medicustom.co.kr)은
//   **한 카페24 상점(atolian)의 멀티도메인**이다. 관리자도 한 곳이다.
//   아람휴비스(aramhuvis.com)는 워드프레스 6.5.13 이다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SITE_PROFILE = path.join(HERE, '.browser-site');

export async function openSiteBrowser({ headless = true } = {}) {
  return chromium.launchPersistentContext(SITE_PROFILE, {
    headless,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
}

// ⚠ `import.meta.url === \`file://${process.argv[1]}\`` 로 비교하면 안 된다.
// 이 폴더 경로에는 공백과 괄호가 있어서 import.meta.url 은 %20 · %28 로 인코딩돼 온다.
// 그래서 늘 거짓이 되고, **아무 일도 안 하고 조용히 끝났다.** (2026-10-23 당함)
const 직접실행 = process.argv[1]
  && decodeURIComponent(new URL(import.meta.url).pathname) === path.resolve(process.argv[1]);
if (직접실행) {
  const ctx = await openSiteBrowser({ headless: false });
  const 열곳 = [
    ['카페24 (릴라이·엘라피엘·메디커스텀 한 곳)', 'https://eclogin.cafe24.com/Shop/'],
    ['아람휴비스 워드프레스', 'https://www.aramhuvis.com/wp-login.php'],
  ];
  for (const [이름, url] of 열곳) {
    const pg = await ctx.newPage();
    await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    console.log(`  ${이름}\n    ${url}`);
  }
  console.log(`
  이 창에서 **두 곳 다 로그인**해 주세요.
    · 카페24 상점 아이디는 atolian 입니다 (세 브랜드가 한 상점입니다)
    · 워드프레스는 aramhuvis.com 관리자 계정입니다

  로그인이 끝나면 이 창은 그대로 두고 알려 주세요.
  다음부터는 제가 이 창으로 직접 들어갑니다. 비밀번호는 보지 않습니다.

  (창을 닫으면 Ctrl+C 로 이 명령을 끝내세요)`);
  // 로그인할 시간을 준다 — 사람이 끝낼 때까지 떠 있는다
  await new Promise(() => {});
}
