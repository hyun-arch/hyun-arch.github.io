#!/usr/bin/env node
// 로그인 → 카테고리 생성 → 나만의 OS 글 전부 발행. 한 창에서 끝까지 간다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser } from '../../publish/naver-open.mjs';
import { assign } from '../lib/route.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../src/pages');
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const ADMIN = `https://admin.blog.naver.com/${CFG.blogId}`;
const LOGIN = 'https://nid.naver.com/nidlogin.login?url=' + encodeURIComponent(ADMIN);
const LOG = '/tmp/pipeline.log';
const P = (...a) => { const s = '  ' + a.join(' '); console.log(s); try { fs.appendFileSync(LOG, s + '\n'); } catch {} };

// ── 올릴 글 모으기 ──
function posts() {
  const out = [];
  for (const dir of ['writings', 'reading']) {
    const d = path.join(SITE, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md')).sort()) {
      const raw = fs.readFileSync(path.join(d, f), 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) continue;
      const fm = Object.fromEntries(m[1].split('\n').map((l) => {
        const i = l.indexOf(':'); return i < 0 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }).filter(Boolean));
      const tags = (fm.tags || '').replace(/[[\]"']/g, '').split(',').map((s) => s.trim()).filter(Boolean);
      // 마크다운을 네이버 본문용 평문으로
      const body = m[2]
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/^>\s?/gm, '')
        .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
        .replace(/^---$/gm, '')
        .replace(/~/g, '\uFF5E')
        .replace(/\n{3,}/g, '\n\n').trim();
      out.push({ file: `${dir}/${f}`, title: fm.title, body, tags, date: fm.date });
    }
  }
  return out;
}

const list = posts();
P(`\n올릴 글 ${list.length}개`);
for (const p of list) {
  const c = assign(p, { commit: false });
  p.cat = c;
  P(`  · ${p.title.slice(0, 34)}…`);
  P(`      → ${c.no} ${c.대분류}${c.중분류 ? ' / ' + c.중분류 : ''}  ${c.번호}`);
}

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
const hasSession = async () => {
  const ck = await ctx.cookies('https://www.naver.com').catch(() => []);
  return ck.some((c) => c.name === 'NID_AUT') && ck.some((c) => c.name === 'NID_SES');
};

if (!(await hasSession())) {
  P('\n로그인 창을 띄웠습니다. QR만 찍으시면 끝까지 알아서 갑니다.');
  await pg.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (const s of ['a:has-text("QR코드")', 'a:has-text("QR 코드")', 'a[href*="qr"]']) {
    const el = pg.locator(s).first();
    if (await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
  }
  const until = Date.now() + 3 * 60 * 60 * 1000;
  let lastQr = Date.now();
  while (Date.now() < until && !(await hasSession())) {
    await pg.waitForTimeout(3000);
    for (const t of ['등록안함', '등록 안함', '나중에']) {
      const b = pg.locator(`a:has-text("${t}"), button:has-text("${t}")`).first();
      if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(1500); }
    }
    if (Date.now() - lastQr > 170000 && /nid\.naver\.com/.test(pg.url())) {
      await pg.goto(LOGIN, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      for (const s of ['a:has-text("QR코드")', 'a:has-text("QR 코드")']) {
        const el = pg.locator(s).first();
        if (await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
      }
      lastQr = Date.now();
    }
  }
}
if (!(await hasSession())) { P('로그인 안 됨 — 종료'); process.exit(1); }
P('\n로그인 확인. 글을 올립니다.');

// ── 글 발행 ──
async function publishOne(p, i) {
  await pg.goto(`https://blog.naver.com/${CFG.blogId}/postwrite`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(5000);
  const f = pg.frames().find((fr) => /PostWriteForm|postwrite/i.test(fr.url())) || pg.mainFrame();
  // "이어서 작성하시겠습니까?" — 취소를 눌러야 새 글로 시작한다. 이걸 먼저 치워야 뒤가 다 막히지 않는다.
  for (let t = 0; t < 20; t++) {
    const pop = f.locator('.se-popup-alert-confirm').first();
    if (!(await pop.isVisible().catch(() => false))) { await pg.waitForTimeout(700); continue; }
    await pop.locator('button:has-text("취소")').first().click({ timeout: 5000, force: true }).catch(() => {});
    await pg.waitForTimeout(1200);
  }
  // 반투명 막이 완전히 걷힐 때까지 기다린다 — 이게 남아 있으면 모든 클릭을 가로챈다
  await f.locator('.se-popup-dim').first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  if (await f.locator('.se-popup-dim').first().isVisible().catch(() => false))
    throw new Error('팝업 막이 안 걷혀 건너뜁니다');
  // 팝업을 치웠어도 초안이 남아 있을 수 있다 — 눈으로 확인하고 비운다
  const before = (await f.locator('.se-component.se-text').allInnerTexts().catch(() => [])).join(' ').replace(/\s+/g, ' ').trim();
  const empty = !before || /글감과 함께 나의 일상을 기록해보세요/.test(before);
  P(`    편집기 ${empty ? '비어 있음' : '초안 남음(' + before.length + '자) — 비웁니다'}`);
  if (!empty) {
    const box = f.locator('.se-component.se-text .se-text-paragraph').first();
    await box.click({ timeout: 15000 }).catch(() => {});
    await pg.keyboard.press('Meta+A');
    await pg.keyboard.press('Backspace');
    await pg.waitForTimeout(1200);
    const after = (await f.locator('.se-component.se-text').allInnerTexts().catch(() => [])).join(' ').trim();
    P(`    비운 뒤 ${after.length}자`);
  }

  const titleBox = f.locator('.se-section-documentTitle .se-text-paragraph, .se-documentTitle .se-text-paragraph').first();
  await titleBox.click({ timeout: 25000 });
  await pg.keyboard.insertText(p.title);
  const bodyBox = f.locator('.se-component.se-text .se-text-paragraph').nth(1)
    .or(f.locator('.se-section-text .se-text-paragraph').last());
  await bodyBox.click({ timeout: 25000 });
  const lines = p.body.split('\n');
  for (let k = 0; k < lines.length; k++) {
    if (lines[k]) await pg.keyboard.insertText(lines[k]);
    if (k < lines.length - 1) await pg.keyboard.press('Enter');
  }
  await pg.waitForTimeout(800);

  const typed = (await f.locator('.se-component.se-text').allInnerTexts().catch(() => [])).join(' ').replace(/\s+/g, ' ');
  P(`    입력 확인 ${typed.length}자 · 앞머리 "${typed.slice(0, 28)}"`);
  if (typed.length < 100) throw new Error('본문이 안 들어갔습니다');

  await f.locator('button[class*="publish_btn"]:visible').first().click({ timeout: 25000 });

  // 발행 설정 레이어가 완전히 뜰 때까지 기다린다
  const layerConfirm = f.locator('button[class*="confirm_btn"]:visible').first();
  await layerConfirm.waitFor({ state: 'visible', timeout: 20000 });
  P('    발행 설정 레이어 열림');

  // 카테고리
  const want = p.cat.중분류 || p.cat.대분류;
  const opener = f.locator('button[class*="selectbox_button"]:visible').first();
  if (await opener.isVisible().catch(() => false)) {
    await opener.click().catch(() => {});
    await pg.waitForTimeout(800);
    const item = f.locator('li:visible, label:visible').filter({ hasText: want }).first();
    if (await item.isVisible().catch(() => false)) { await item.click().catch(() => {}); P('    카테고리 ' + want); }
    else { P('    카테고리 "' + want + '" 없음 — 기본값으로 둡니다'); await pg.keyboard.press('Escape').catch(() => {}); }
    await pg.waitForTimeout(600);
  }

  // 태그
  const tag = f.locator('input[placeholder*="태그"]:visible, #tag-input').first();
  if (await tag.isVisible().catch(() => false)) {
    for (const t of [...p.tags, p.cat.번호]) {
      await tag.click().catch(() => {});
      await pg.keyboard.insertText(t);
      await pg.keyboard.press('Enter');
      await pg.waitForTimeout(200);
    }
    P('    태그 ' + (p.tags.length + 1) + '개');
  }

  await layerConfirm.click({ timeout: 25000 });
  await pg.waitForTimeout(8000);
  const url = pg.url();
  if (/postwrite/i.test(url)) throw new Error('발행 확인 안 됨');
  return url;
}

const done = [];
const only = process.argv.includes('--하나') ? 1 : list.length;
const from = Number(process.env.START || 0);
for (let i = from; i < Math.min(from + only, list.length); i++) {
  const p = list[i];
  try { const u = await publishOne(p, i); done.push(u); P(`  올림  ${p.title.slice(0, 28)}…  ${u}`); }
  catch (e) { P(`  실패  ${p.title.slice(0, 28)}…  ${e.message}`); await pg.screenshot({ path: `/tmp/fail-${i}.png` }).catch(() => {}); }
  await pg.waitForTimeout(2500);
}
P(`\n끝. ${done.length}/${list.length}개 발행.`);

// 곱게 닫아야 로그인 세션이 남는다
await ctx.close().catch(() => {});
