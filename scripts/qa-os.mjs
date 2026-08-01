// 전역 OS 레이어 자가검수 — 퀵캡처 · 자동분류 · 승격 · 팔레트 · 넛지
// node scripts/qa-os.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:4331').replace(/\/$/, '');
const OUT = process.argv[3] || './qa-os';
mkdirSync(OUT, { recursive: true });

const errs = [];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 960 } });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error' && !/supabase/i.test(m.text())) errs.push('CONSOLE: ' + m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));

const R = {};

// ── 1. 홈에서 퀵캡처가 살아있는가 ──
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
R.fabOnHome = await p.locator('#osFab').isVisible();

// 단축키 C 로 열리는가
await p.keyboard.press('c');
await p.waitForTimeout(400);
R.capOpensWithC = await p.locator('#osCap').isVisible();

// ── 2. 자동 분류 라우터가 미리보기를 내는가 ──
const cases = [
  ['내일 오후 3시 치과 예약', '일정'],
  ['이번 주까지 매출 지표 정리하기 #경영', '할 일'],
  ['https://example.com 나중에 읽기', '자료'],
  ['아라미러를 서버로 올리기로 정했다', '결정'],
  ['이게 진짜 자산이 되려면 뭐가 필요할까?', '질문'],
  ['거울은 나를 비추는 게 아니라 되묻는 것이다', '생각'],
];
R.routing = [];
for (const [text, want] of cases) {
  await p.fill('#osCapIn', text);
  await p.waitForTimeout(220);
  const got = (await p.textContent('#osCapRoute')) || '';
  R.routing.push({ text, want, ok: got.includes(want), got: got.slice(0, 60) });
}
await p.screenshot({ path: `${OUT}/01-capture-home.png` });

// ── 3. 실제로 던져지는가 (6건) ──
for (const [text] of cases) {
  await p.fill('#osCapIn', text);
  await p.waitForTimeout(120);
  await p.click('#osCapSave');
  await p.waitForTimeout(160);
}
R.badge = await p.textContent('#osFabN');

// ── 4. ⌘K 팔레트 ──
await p.keyboard.press('Escape');
await p.keyboard.press('Control+k');
await p.waitForTimeout(400);
R.paletteOpens = await p.locator('#osPal').isVisible();
await p.fill('#osPalQ', '배짱');
await p.waitForTimeout(300);
R.paletteCrewHits = await p.locator('.os-pal-row').count();
await p.screenshot({ path: `${OUT}/02-palette.png` });
await p.fill('#osPalQ', '승격');
await p.waitForTimeout(300);
R.paletteMineHits = await p.locator('.os-pal-row').count();
await p.keyboard.press('Escape');

// ── 5. 인박스 — 던진 게 실제로 있는가 + 승격이 도는가 ──
await p.goto(BASE + '/inbox/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
R.inboxCount = await p.locator('[data-list="inbox"] .ic').count();
await p.screenshot({ path: `${OUT}/03-inbox.png` });

// 같은 항목을 3번 승격 → 인박스에서 자산까지 끝까지 올려본다
const targetId = await p.locator('[data-list="inbox"] .ic').first().getAttribute('id');
for (let i = 0; i < 3; i++) {
  await p.click(`#${targetId} .ic-b.up`);
  await p.waitForTimeout(320);
}
R.promotedToAsset = await p.locator(`[data-list="asset"] #${targetId}`).count();
R.assetCount = await p.locator('[data-list="asset"] .ic').count();
R.promoteRate = await p.locator('.ib-st.good b').nth(1).textContent();
await p.screenshot({ path: `${OUT}/04-promoted.png` });

// verified 토글
const vb = p.locator('.ic-v').first();
const v0 = await vb.textContent();
await vb.click(); await p.waitForTimeout(240);
const v1 = await p.locator('.ic-v').first().textContent();
R.verifyToggle = { from: (v0 || '').trim(), to: (v1 || '').trim(), changed: v0 !== v1 };

// 종류 필터
await p.click('.ibf[data-k="todo"]');
await p.waitForTimeout(300);
R.todoFilterCount = await p.locator('.ic').count();
await p.click('.ibf[data-k="all"]');

// ── 6. 결정 카드 ──
await p.fill('#decQ', '아라미러를 서버로 올릴까, 로컬에 둘까');
await p.fill('#decD', '당분간 로컬 우선 — 금고(재무)는 배포에서 제외');
await p.fill('#decC', '데이터가 물리적으로 어디 사는가가 보안의 본질이라서');
await p.fill('#decR', '기기가 바뀌면 접근 불가 — 내보내기 습관이 전제');
await p.fill('#decF', '내일 아침 인박스 내보내기 한 번 돌려보기');
await p.click('.dec-save');
await p.waitForTimeout(500);
R.decisionCards = await p.locator('.dc').count();
await p.locator('.ib-dec').scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/05-decision.png` });

// ── 7. 정직 로그 ──
await p.locator('.ib-honest').scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
R.honestRows = await p.locator('.hs').count();
await p.screenshot({ path: `${OUT}/06-honest.png` });

// ── 8. 먼저 말 거는 배너 (기한 지난 할 일을 심고 새로고침) ──
await p.evaluate(() => {
  const OS = window.aramOS;
  const it = OS.capture('어제까지 보내야 했던 계약서 보내기');
  OS.updateItem(it.id, { due: '2020-01-01', kind: 'todo' });
});
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2400);
R.nudgeShown = await p.locator('#osNudge').isVisible();
R.nudgeMsg = (await p.textContent('#osNudgeMsg')) || '';
await p.screenshot({ path: `${OUT}/07-nudge.png` });

// ── 9. 데이터가 페이지를 넘어 살아남는가 ──
await p.goto(BASE + '/flow/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
R.badgeOnOtherPage = await p.textContent('#osFabN');
R.fabEverywhere = await p.locator('#osFab').isVisible();

// ── 10. 모바일 ──
const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
mp.on('pageerror', (e) => errs.push('MOBILE: ' + e.message));
await mp.goto(BASE + '/inbox/', { waitUntil: 'networkidle' });
await mp.waitForTimeout(1200);
await mp.screenshot({ path: `${OUT}/08-mobile-inbox.png` });
await mp.locator('#osFab').click();
await mp.waitForTimeout(500);
await mp.screenshot({ path: `${OUT}/09-mobile-capture.png` });
R.mobileOverflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

R.errors = errs;
console.log(JSON.stringify(R, null, 2));
await b.close();
