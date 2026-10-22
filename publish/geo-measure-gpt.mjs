#!/usr/bin/env node
// GEO 측정 — ChatGPT 판. Perplexity 가 무료 한도에 걸릴 때 쓴다.
//
//   node publish/geo-measure-gpt.mjs 엘라피엘
//
// Perplexity 와 다른 점: ChatGPT 는 출처 URL 을 늘 보여 주지 않는다.
// 그래서 「브랜드 이름이 답변에 나오는가」를 주로 센다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const 측정 = path.resolve(HERE, '../../../31. 이니_GEO/geo/측정');
const 세트 = JSON.parse(fs.readFileSync(path.join(측정, '질문세트.json'), 'utf8'));
const 우리이름 = ['아람휴비스','aramhuvis','aram huvis','릴라이','lilai',
                 '엘라피엘','ellapiel','메디커스텀','medicustom','이안사랑'];
const 우리주소 = ['aramhuvis.com','aramhuvis.eu','lilai.ai','ellapiel.co.kr',
                 'medicustom.co.kr','blog.naver.com/ianlove80'];

async function 물어보기(pg, q) {
  await pg.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(5000);
  const box = pg.locator('#prompt-textarea, div[contenteditable="true"]').first();
  await box.click({ timeout: 20000 });
  await pg.keyboard.insertText(q);
  await pg.waitForTimeout(800);
  await pg.keyboard.press('Enter');

  // 답변이 멈출 때까지 — 글자 수가 더 안 늘면 끝난 것으로 본다
  let 전 = 0, 안늚 = 0;
  for (let i = 0; i < 40; i++) {
    await pg.waitForTimeout(2500);
    const 지금 = await pg.evaluate(() => (document.body.innerText || '').length).catch(() => 0);
    if (지금 === 전) { if (++안늚 >= 3 && 지금 > 800) break; } else 안늚 = 0;
    전 = 지금;
  }
  return pg.evaluate(() => {
    const 답 = [...document.querySelectorAll('[data-message-author-role="assistant"]')]
      .map(e => e.innerText).join('\n');
    return {
      본문: (답 || document.body.innerText || '').replace(/\s+/g, ' '),
      링크: [...document.querySelectorAll('a[href^="http"]')]
        .map(a => a.href).filter(h => !/openai|chatgpt/.test(h)),
    };
  });
}

const 고를것 = process.argv.find(a => !a.startsWith('--') && !a.includes('/') && !a.endsWith('.mjs'));
const 대상 = 고를것 ? 세트.사이트.filter(s => s.이름 === 고를것) : 세트.사이트;
const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-ai'),
  { headless: false, viewport: null });
const pg = ctx.pages()[0] || (await ctx.newPage());
const 결과 = [];
try {
  for (const site of 대상) {
    for (const [i, q] of site.질문.entries()) {
      process.stdout.write(`  ${site.이름} ${i + 1}/${site.질문.length} …`);
      let r;
      try { r = await 물어보기(pg, q); }
      catch (e) { console.log(`\r  ${site.이름} ${i+1}  ✗ ${e.message.split('\n')[0].slice(0,45)}`); continue; }

      if (/한도|limit reached|Upgrade to|사용량/i.test(r.본문.slice(0, 300))) {
        console.log(`\r  ${site.이름} ${i+1}  ⚠ 한도에 걸렸습니다 — 기록하지 않고 멈춥니다`);
        break;
      }
      if (r.본문.length < 100) {
        console.log(`\r  ${site.이름} ${i+1}  ? 답변이 짧습니다(${r.본문.length}자) — 기록하지 않습니다`);
        continue;
      }
      const 이름적중 = 우리이름.filter(n => r.본문.toLowerCase().includes(n.toLowerCase()));
      const 출처적중 = r.링크.filter(h => 우리주소.some(u => h.includes(u)));
      const 적중 = 이름적중.length > 0 || 출처적중.length > 0;
      결과.push({ 사이트: site.이름, 번호: i+1, 질문: q, 적중,
                 출처: 출처적중.slice(0,5), 이름: 이름적중, 답변길이: r.본문.length });
      console.log(`\r  ${site.이름} ${i+1}/${site.질문.length}  ` +
                  (적중 ? `○ ${이름적중[0] || 출처적중[0] || ''}`.slice(0,46)
                        : `✗ 안 나옴 (답변 ${r.본문.length}자)`));
      await pg.waitForTimeout(3000);
    }
  }
} finally {
  if (결과.length) {
    const p = path.join(측정, '측정결과_chatgpt.json');
    let 기존 = { 서비스: 'ChatGPT', 결과: [] };
    try { 기존 = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    const 키 = (r) => r.사이트 + '/' + r.번호;
    const 새 = new Set(결과.map(키));
    기존.결과 = [...기존.결과.filter(r => !새.has(키(r))), ...결과]
      .sort((a,b) => a.사이트.localeCompare(b.사이트) || a.번호 - b.번호);
    기존.잰날 = new Date().toISOString().slice(0,10);
    fs.writeFileSync(p, JSON.stringify(기존, null, 1), 'utf8');
    console.log(`\n  이번 ${결과.filter(r=>r.적중).length}/${결과.length} · 누적 ${기존.결과.filter(r=>r.적중).length}/${기존.결과.length}`);
  }
  await ctx.close().catch(()=>{});
}
