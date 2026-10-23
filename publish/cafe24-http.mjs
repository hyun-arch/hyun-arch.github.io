// 카페24 관리자를 **브라우저 없이** 두드려 본다.
// 왜 — 카페24 관리자는 자동화 브라우저를 막는다("비정상적인 접속입니다").
//      세션 쿠키 자체가 살아 있다면 HTTP 로는 될 수 있다. (2026-10-23)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-site'), { headless: true });
const 쿠키 = await ctx.cookies(['https://atolian.cafe24.com', 'https://cafe24.com', 'https://eclogin.cafe24.com']);
await ctx.close();

const 머리 = 쿠키.map((c) => `${c.name}=${c.value}`).join('; ');
console.log(`쿠키 ${쿠키.length}개를 꺼냈습니다.`);

for (const u of ['https://atolian.cafe24.com/admin/php/main.php',
                 'https://atolian.cafe24.com/disp/admin/shop1/design/DesignSkinManage']) {
  const r = await fetch(u, {
    headers: { cookie: 머리, 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
               'accept-language': 'ko-KR,ko;q=0.9' },
    redirect: 'manual',
  }).catch((e) => ({ status: 0, err: e.message }));
  const 위치 = r.headers ? r.headers.get('location') : '';
  const 본문 = r.text ? (await r.text().catch(() => '')) : '';
  console.log(`\n${u.slice(8, 70)}`);
  console.log(`  ${r.status} ${위치 ? '→ ' + 위치.slice(0, 60) : ''}`);
  console.log("  본문:", 본문.replace(/\s+/g," ").slice(0,300));
}
