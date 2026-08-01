// /dna 페이지 자가검수 — 스크린샷 + 상호작용 + 콘솔에러 점검
//
//   1) npm run build
//   2) npx astro preview --port 4331
//   3) node scripts/qa-dna.mjs [baseUrl] [outDir]
//
// 왜 있나 : 눈으로 안 보고 "다 됐다"고 말하지 않기 위해.
// (최강훈 유전자 — "추정하지 말고 측정할 것")
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4331';
const OUT = process.argv[3] || './qa-shots';
const URL = `${BASE.replace(/\/$/, '')}/dna/`;
mkdirSync(OUT, { recursive: true });

const errs = [];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 960 } });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
p.on('requestfailed', (r) => errs.push('REQFAIL: ' + r.url()));

await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
await p.screenshot({ path: `${OUT}/01-hero.png` });

await p.locator('#genes').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/02-genes.png` });

await p.locator('.dna-applied').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/03-applied.png` });

await p.locator('#roster').scrollIntoViewIfNeeded();
await p.waitForTimeout(800);
await p.evaluate(() => window.scrollBy(0, 620));
await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/04-roster.png` });

await p.click('.fl[data-gen="1"]');
await p.click('.fl[data-grp="3조"]');
await p.waitForTimeout(400);
const cFilter = await p.textContent('#dnaCount');
await p.screenshot({ path: `${OUT}/05-filter.png` });

await p.click('#dnaReset');
await p.fill('#dnaQ', '텔레그램');
await p.waitForTimeout(400);
const cSearch = await p.textContent('#dnaCount');
await p.screenshot({ path: `${OUT}/06-search.png` });

await p.click('#dnaReset');
await p.locator('.gene-card[data-gene="evidence"]').scrollIntoViewIfNeeded();
await p.click('.gene-card[data-gene="evidence"]');
await p.waitForTimeout(900);
const cGene = await p.textContent('#dnaCount');
await p.screenshot({ path: `${OUT}/07-gene-filter.png` });

await p.click('#dnaReset');
await p.waitForTimeout(300);
await p.locator('.ppl').nth(4).scrollIntoViewIfNeeded();
await p.locator('.ppl').nth(4).click();
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/08-sheet.png` });
const sheet1 = await p.textContent('.sh-name');
await p.click('#sheetNext');
await p.waitForTimeout(400);
const sheet2 = await p.textContent('.sh-name');
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
const escClosed = await p.locator('#dnaSheet').isHidden();

await p.fill('#dnaQ', '베짱이');
await p.waitForTimeout(400);
await p.locator('.ppl:not([hidden])').first().click();
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/09-empty.png` });
await p.keyboard.press('Escape');

await p.click('#dnaReset');
await p.locator('.dna-end').scrollIntoViewIfNeeded();
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/10-end.png` });

const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
mp.on('pageerror', (e) => errs.push('MOBILE PAGEERROR: ' + e.message));
await mp.goto(URL, { waitUntil: 'networkidle' });
await mp.waitForTimeout(1800);
await mp.screenshot({ path: `${OUT}/11-mobile-hero.png` });
await mp.locator('#roster').scrollIntoViewIfNeeded();
await mp.waitForTimeout(800);
await mp.screenshot({ path: `${OUT}/12-mobile-roster.png` });
await mp.locator('.ppl').nth(2).click();
await mp.waitForTimeout(700);
await mp.screenshot({ path: `${OUT}/13-mobile-sheet.png` });

const mobileOverflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
const desktopOverflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

console.log(JSON.stringify(
  { cFilter, cSearch, cGene, sheet1, sheet2, escClosed, mobileOverflow, desktopOverflow, errors: errs },
  null, 2
));
await b.close();
