// 아라미 데크 자가검수 — 레벨/XP/미션/파이프라인/업적/축하
// node scripts/qa-deck.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://localhost:4340').replace(/\/$/, '');
const OUT = process.argv[3] || './qa-deck';
mkdirSync(OUT, { recursive: true });

const errs = [];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/supabase|ERR_NAME/i.test(m.text())) errs.push('CONSOLE: ' + m.text()); });

const R = {};
const closeCele = async () => {
  if (await p.locator('#cele').isVisible()) {
    const t = await p.textContent('.cele-t');
    await p.evaluate(() => { document.getElementById('cele').hidden = true; });
    return t;
  }
  return null;
};

await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
R.deckVisible = await p.locator('.dk-cap').isVisible();
R.level0 = await p.textContent('#rkName');
R.xp0 = await p.textContent('#dkXp');
R.missionCount = await p.locator('.miss').count();
R.badgeTiles = await p.locator('.bg').count();
R.todayCrew = (await p.textContent('.cw-n')) || '';
await p.screenshot({ path: `${OUT}/01-deck-empty.png` });

// 분류 미리보기
await p.fill('#dkIn', '이번 주까지 매출 지표 정리하기 #경영');
await p.waitForTimeout(400);
R.routePreview = ((await p.textContent('#dkRoute')) || '').slice(0, 70);
await p.screenshot({ path: `${OUT}/02-route.png` });

// 12줄 던지기 → XP·레벨·배지 반응
const lines = ['내일 10시 경영회의', 'https://example.com 읽기', '아라미러 서버 올리기로 정했다',
  '이게 자산이 되려면 뭐가 필요할까?', '거울은 되묻는 것이다', '이번주까지 KPI 정리 #경영',
  '팀 회고 준비하기 #경영', '수면 기록 시작 #건강', '고객 인터뷰 5명 #경영',
  '발행 전 게이트 만들기 #경영', '아침 브리핑 개선 #경영', '셸 봇 점검하기 #경영'];
for (const t of lines) {
  await closeCele();
  await p.fill('#dkIn', t);
  await p.click('.dk-cap-btn');
  await p.waitForTimeout(230);
}
await p.waitForTimeout(900);
R.firstCelebration = await closeCele();
R.xpAfterCapture = await p.textContent('#dkXp');
R.levelAfterCapture = await p.textContent('#rkName');
R.inbox = await p.textContent('#pfInbox');
R.missionProgress = await p.textContent('#dkMissN');
await p.screenshot({ path: `${OUT}/03-deck-active.png` });

// 업적 전부 보기
await p.click('#dkBadgeToggle');
await p.waitForTimeout(500);
R.badgeTilesAll = await p.locator('.bg').count();
R.badgeGot = await p.textContent('#dkBadgeN');
await p.screenshot({ path: `${OUT}/04-badges.png` });

// 승격 → 자산 → XP 상승
await p.goto(BASE + '/inbox/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const id = await p.locator('[data-list="inbox"] .ic').first().getAttribute('id');
for (let i = 0; i < 3; i++) { await p.click(`#${id} .ic-b.up`); await p.waitForTimeout(280); }
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1600);
R.celebrationOnAsset = await p.locator('#cele').isVisible();
if (R.celebrationOnAsset) { R.celeTitle = await p.textContent('.cele-t'); await p.screenshot({ path: `${OUT}/05-celebrate.png` }); }
// 축하 카드 버튼이 실제로 눌리는가 (컨페티가 클릭 가로막던 버그 회귀 방지)
if (R.celebrationOnAsset) {
  await p.click('.cele-x', { timeout: 5000 });
  await p.waitForTimeout(300);
  R.celeClosableByButton = await p.locator('#cele').isHidden();
}
R.xpAfterPromote = await p.textContent('#dkXp');
R.assets = await p.textContent('#pfAsset');
R.levelFinal = await p.textContent('#rkName');
R.desktopOverflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
await p.screenshot({ path: `${OUT}/06-deck-final.png` });

// 모바일
const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
mp.on('pageerror', (e) => errs.push('MOBILE: ' + e.message));
await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
await mp.waitForTimeout(1800);
await mp.screenshot({ path: `${OUT}/07-mobile.png` });
R.mobileOverflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

R.errors = errs;
console.log(JSON.stringify(R, null, 1));
await b.close();
