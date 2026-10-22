#!/usr/bin/env node
// 주마다 잰 결과를 견준다. 「올랐나 내렸나」만 본다.
//   node publish/geo-추이.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const M = path.resolve(HERE, '../../../31. 이니_GEO/geo/측정');
const 기록 = path.join(M, '기록');

const 읽기 = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')).결과 || []; } catch { return []; } };
const 지금 = [...읽기(path.join(M, '측정결과_perplexity.json')),
             ...읽기(path.join(M, '측정결과_chatgpt.json'))];

const 과거 = fs.existsSync(기록)
  ? [...new Set(fs.readdirSync(기록).map(f => f.slice(0, 10)))].sort()
  : [];

const 집계 = (rs) => {
  const m = {};
  for (const r of rs) {
    m[r.사이트] ??= { 적중: 0, 전체: 0 };
    m[r.사이트].전체++; if (r.적중) m[r.사이트].적중++;
  }
  return m;
};

const 이번 = 집계(지금);
console.log('\n  GEO 측정 추이\n');

if (!과거.length) {
  console.log('  이번이 첫 측정입니다. 다음 주부터 비교가 나옵니다.\n');
  for (const [s, v] of Object.entries(이번))
    console.log(`    ${s.padEnd(8)} ${v.적중}/${v.전체}`);
  console.log('');
  process.exit(0);
}

const 직전날 = 과거[과거.length - 1];
const 직전 = 집계(fs.readdirSync(기록).filter(f => f.startsWith(직전날))
  .flatMap(f => 읽기(path.join(기록, f))));

console.log(`  ${직전날} → 오늘\n`);
for (const [s, v] of Object.entries(이번)) {
  const p = 직전[s];
  const 전 = p ? `${p.적중}/${p.전체}` : '—';
  const 차 = p ? v.적중 - p.적중 : null;
  const 표 = 차 === null ? '' : 차 > 0 ? `  ↑ +${차}` : 차 < 0 ? `  ↓ ${차}` : '  = 그대로';
  console.log(`    ${s.padEnd(8)} ${전} → ${v.적중}/${v.전체}${표}`);
}

// 떨어진 질문 — 나왔다가 안 나오게 된 것. 가장 먼저 봐야 한다
const 전맵 = {};
for (const f of fs.readdirSync(기록).filter(f => f.startsWith(직전날)))
  for (const r of 읽기(path.join(기록, f))) 전맵[r.사이트 + '/' + r.번호] = r.적중;
const 떨어짐 = 지금.filter(r => 전맵[r.사이트 + '/' + r.번호] === true && !r.적중);
if (떨어짐.length) {
  console.log(`\n  ⚠ 나왔다가 안 나오게 된 질문 ${떨어짐.length}개`);
  떨어짐.forEach(r => console.log(`    · ${r.사이트} ${r.번호}. ${r.질문.slice(0, 40)}`));
}
const 새로 = 지금.filter(r => 전맵[r.사이트 + '/' + r.번호] === false && r.적중);
if (새로.length) {
  console.log(`\n  ✓ 새로 나오게 된 질문 ${새로.length}개`);
  새로.forEach(r => console.log(`    · ${r.사이트} ${r.번호}. ${r.질문.slice(0, 40)}`));
}
console.log('');
