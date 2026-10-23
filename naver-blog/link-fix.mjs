#!/usr/bin/env node
// 원고 안의 내부 링크를 **진짜 글 주소**로 바꾼다.
//
//   node naver-blog/link-fix.mjs            무엇이 바뀔지만 보여 준다
//   node naver-blog/link-fix.mjs --적용     원고를 고친다
//
// 왜 (2026-10-23) —
//   원고에 [두피진단기 원리](https://blog.naver.com/ianlove80) 처럼 **블로그 홈**만
//   적혀 있었다. 독자가 눌러도 그 글로 못 간다. 발행된 글 중에서 제목이 맞는 것을
//   찾아 글 주소로 바꾼다. 아직 발행 안 된 글은 그대로 두고 이름을 알려 준다.
import fs from 'node:fs';
import path from 'node:path';

const 적용 = process.argv.includes('--적용');
const blogId = process.argv.includes('--blog')
  ? process.argv[process.argv.indexOf('--blog') + 1] : 'ianlove80';
const UA = { 'user-agent': 'Mozilla/5.0' };

const 목록 = new Map();
for (let p = 1; p <= 4; p += 1) {
  const t = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${p}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
    { headers: UA }).then((r) => r.text()).catch(() => '');
  const 전 = 목록.size;
  for (const m of t.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
    목록.set(decodeURIComponent(m[2].replace(/\+/g, ' ')), m[1]);
  }
  if (목록.size === 전) break;
}
console.log(`  발행된 글 ${목록.size}편을 받았습니다.\n`);

// 제목은 링크 글자와 똑같이 생기지 않는다. 두 글자 조각이 얼마나 겹치나로 고른다.
const 납작 = (x) => x.replace(/[\s,·—–\-'"?!()]/g, '');
const 조각 = (x) => {
  const n = 납작(x).replace(/[^가-힣A-Za-z0-9]/g, '');
  const s = new Set();
  for (let i = 0; i + 2 <= n.length; i += 1) s.add(n.slice(i, i + 2));
  return s;
};
const 찾아주소 = (이름) => {
  const n = 납작(이름);
  if (n.length < 4 || n.length > 40) return null;
  const a = 조각(이름);
  let best = null; let 점수 = 0;
  for (const [제목, 번호] of 목록) {
    const b = 조각(제목);
    let 겹침 = 0;
    a.forEach((x) => { if (b.has(x)) 겹침 += 1; });
    const 비율 = 겹침 / a.size;
    if (비율 > 점수) { 점수 = 비율; best = 번호; }
  }
  return 점수 >= 0.7 ? `https://blog.naver.com/${blogId}/${best}` : null;
};

const 뿌리 = path.resolve('naver-blog/posts');
const 못찾음 = new Map();
let 고친파일 = 0; let 고친링크 = 0;

for (const d of fs.readdirSync(뿌리).sort()) {
  const f = path.join(뿌리, d, 'post.md');
  if (!fs.existsSync(f)) continue;
  const 전 = fs.readFileSync(f, 'utf8');
  let 바뀐수 = 0;
  const 후 = 전.replace(
    new RegExp(`\\[([^\\]]+)\\]\\((https?://(?:m\\.)?blog\\.naver\\.com/${blogId})/?\\)`, 'g'),
    (전부, 이름) => {
      const 주소 = 찾아주소(이름);
      if (!주소) {
        못찾음.set(이름, (못찾음.get(이름) || 0) + 1);
        return 전부;
      }
      바뀐수 += 1;
      return `[${이름}](${주소})`;
    });
  if (!바뀐수) continue;
  고친파일 += 1; 고친링크 += 바뀐수;
  console.log(`  ${d}  링크 ${바뀐수}개`);
  for (const m of 후.matchAll(/\[([^\]]+)\]\((https:\/\/blog\.naver\.com\/[^/]+\/\d+)\)/g)) {
    console.log(`     ${m[1]} → ${m[2]}`);
  }
  if (적용) fs.writeFileSync(f, 후);
}

console.log(`\n  ${적용 ? '고쳤습니다' : '볼 것만 봤습니다'}: 글 ${고친파일}편 · 링크 ${고친링크}개`);
if (못찾음.size) {
  console.log('\n  아직 발행 안 된 글을 가리키는 링크 (그대로 뒀습니다):');
  for (const [이름, 수] of [...못찾음].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${이름}  ${수}곳`);
  }
  console.log('  → 그 글을 발행하면 이 명령을 다시 돌려 연결하세요.');
}
if (!적용) console.log('\n  실제로 고치려면 --적용 을 붙이세요.');
