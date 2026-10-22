#!/usr/bin/env node
// GEO 측정 — AI 에 질문하고 「우리가 출처로 나오는가」를 센다.
//
//   node publish/geo-measure.mjs                   네 사이트 전부
//   node publish/geo-measure.mjs 릴라이             한 곳만
//   node publish/geo-measure.mjs --서비스 perplexity
//
// ai-login.mjs 로 로그인해 둔 전용 브라우저를 쓴다.
// Perplexity 를 기본으로 하는 이유: 출처 URL 을 명시해서 눈으로 셀 수 있다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, '.browser-ai');
const 측정 = path.resolve(HERE, '../../../31. 이니_GEO/geo/측정');
const 세트 = JSON.parse(fs.readFileSync(path.join(측정, '질문세트.json'), 'utf8'));

// 우리 것으로 칠 주소 — 이게 답변에 나오면 적중
const 우리 = [
  'aramhuvis.com', 'aramhuvis.eu', 'lilai.ai', 'ellapiel.co.kr', 'medicustom.co.kr',
  'blog.naver.com/ianlove80',
];
const 우리이름 = ['아람휴비스', 'aramhuvis', 'aram huvis', '릴라이', 'lilai',
                 '엘라피엘', 'ellapiel', '메디커스텀', 'medicustom', '이안사랑'];

const 이름적중Pre = (t) => 우리이름.some(n => t.toLowerCase().includes(n.toLowerCase()));

async function 물어보기(pg, q) {
  await pg.goto('https://www.perplexity.ai/search?q=' + encodeURIComponent(q),
                { waitUntil: 'domcontentloaded', timeout: 60000 });
  // 답변이 다 나올 때까지 — 글자 수가 더 안 늘면 끝난 것으로 본다
  let 전 = 0;
  for (let i = 0; i < 20; i++) {
    await pg.waitForTimeout(3000);
    const 지금 = await pg.evaluate(() => (document.body.innerText || '').length).catch(() => 0);
    if (지금 === 전 && 지금 > 500) break;
    전 = 지금;
  }
  return pg.evaluate(() => ({
    본문: (document.body.innerText || '').replace(/\s+/g, ' '),
    링크: [...document.querySelectorAll('a[href^="http"]')]
      .map(a => a.href).filter(h => !/perplexity\.ai/.test(h)),
  }));
}

const 고를것 = process.argv.find(a => !a.startsWith('--') && !a.endsWith('.mjs') && !a.includes('/'));
const 대상 = 고를것 ? 세트.사이트.filter(s => s.이름 === 고를것) : 세트.사이트;

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: false, viewport: null });
const pg = ctx.pages()[0] || (await ctx.newPage());
const 결과 = [];
try {
  for (const site of 대상) {
    for (const [i, q] of site.질문.entries()) {
      process.stdout.write(`  ${site.이름} ${i + 1}/${site.질문.length} …`);
      let r;
      try { r = await 물어보기(pg, q); }
      catch (e) { console.log(`\r  ${site.이름} ${i + 1}  ✗ ${e.message.slice(0, 40)}`); continue; }

      if (/로그인|Sign in|가입한 뒤/.test(r.본문.slice(0, 400))) {
        console.log(`\r  ${site.이름} ${i + 1}  ⚠ 로그인이 필요합니다 — 창에서 로그인해 주세요`);
        break;
      }
      // 무료 한도 — 여기 걸리면 「안 나옴」이 아니라 「못 물어봄」이다.
      // 0건을 적중 실패로 쌓으면 없는 결론이 생긴다. (2026-10-22 실측: 10회에서 걸렸다)
      if (/free search limit|무료 검색|Upgrade to Perplexity Pro/i.test(r.본문)) {
        console.log(`\r  ${site.이름} ${i + 1}  ⚠ 무료 한도에 걸렸습니다 — 몇 시간 뒤 다시 되거나 Pro 가 필요합니다`);
        console.log('      여기서 멈춥니다. 한도에 걸린 질문은 기록하지 않습니다.');
        break;
      }
      // 출처가 0개면 답변이 안 나온 것일 수 있다 — 적중 실패로 단정하지 않는다
      if (r.링크.length === 0 && !이름적중Pre(r.본문)) {
        console.log(`\r  ${site.이름} ${i + 1}  ? 출처 0개 — 답변이 안 나왔을 수 있어 기록하지 않습니다`);
        continue;
      }
      const 출처적중 = r.링크.filter(h => 우리.some(u => h.includes(u)));
      const 이름적중 = 우리이름.filter(n => r.본문.toLowerCase().includes(n.toLowerCase()));
      const 적중 = 출처적중.length > 0 || 이름적중.length > 0;
      결과.push({
        사이트: site.이름, 번호: i + 1, 질문: q,
        적중, 출처: 출처적중.slice(0, 5), 이름: 이름적중,
        출처수: r.링크.length,
      });
      console.log(`\r  ${site.이름} ${i + 1}/${site.질문.length}  ` +
                  (적중 ? `○ ${이름적중[0] || 출처적중[0] || ''}`.slice(0, 50)
                        : `✗ 안 나옴 (출처 ${r.링크.length}개 중)`));
      await pg.waitForTimeout(4000);   // 너무 빠르면 막힌다
    }
  }
} finally {
  if (결과.length) {
    const p = path.join(측정, '측정결과_perplexity.json');
    // 이어서 쌓는다 — 사이트별로 따로 돌리면 앞 결과가 날아간다 (2026-10-22 실측)
    let 기존 = { 잰날: '', 서비스: 'Perplexity', 결과: [] };
    try { 기존 = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    const 키 = (r) => r.사이트 + '/' + r.번호;
    const 새키 = new Set(결과.map(키));
    기존.결과 = [...기존.결과.filter(r => !새키.has(키(r))), ...결과]
      .sort((a, b) => a.사이트.localeCompare(b.사이트) || a.번호 - b.번호);
    기존.잰날 = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(p, JSON.stringify(기존, null, 1), 'utf8');
    const 적중 = 기존.결과.filter(r => r.적중).length;
    console.log(`\n  이번 ${결과.filter(r=>r.적중).length}/${결과.length} · 누적 ${적중}/${기존.결과.length} → 측정결과_perplexity.json`);
  }
  await ctx.close().catch(() => {});
}
