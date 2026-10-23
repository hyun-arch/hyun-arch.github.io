#!/usr/bin/env node
// 발행 대기열 — 검사를 통과한 글을 **순서대로** 올리고, 올릴 때마다 링크를 잇는다.
//
//   node naver-blog/queue.mjs            무엇을 어떤 순서로 올릴지만 보여 준다
//   node naver-blog/queue.mjs --적용
//   node naver-blog/queue.mjs --적용 --몇개 3
//
// 왜 (2026-10-23) —
//   글들이 서로를 가리킨다. A 가 B 를 가리키는데 B 가 아직 없으면 A 는 검사에서 떨어진다.
//   그래서 **남이 많이 가리키는 글부터** 올린다. 하나 올릴 때마다 link-fix 를 돌리면
//   그 글을 가리키던 원고들이 그 자리에서 통과한다.
//
// 두 번 올리지 않는다 —
//   발행 전에 블로그의 실제 글 목록을 받아 **제목이 겹치면 건너뛴다**.
//   published.json 만 믿지 않는다. 그 파일이 없어도 글은 이미 올라가 있을 수 있다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 적용 = process.argv.includes('--적용');
const 몇개 = process.argv.includes('--몇개')
  ? Number(process.argv[process.argv.indexOf('--몇개') + 1]) : 99;
const blogId = 'ianlove80';
const 뿌리 = path.resolve('naver-blog/posts');

const 납작 = (x) => x.replace(/[\s,·—–\-'"?!()]/g, '');
const 조각 = (x) => {
  const n = 납작(x).replace(/[^가-힣A-Za-z0-9]/g, '');
  const s = new Set();
  for (let i = 0; i + 2 <= n.length; i += 1) s.add(n.slice(i, i + 2));
  return s;
};
// 두 글이 같은 글인가 — 양쪽 길이가 비슷할 때 쓴다
const 닮음 = (a, b) => {
  const A = 조각(a); const B = 조각(b);
  if (!A.size || !B.size) return 0;
  let c = 0;
  A.forEach((x) => { if (B.has(x)) c += 1; });
  return c / Math.max(A.size, B.size);
};
// 링크 글자가 이 제목을 가리키나 — 링크 글자는 제목보다 **짧다**.
// 긴 쪽으로 나누면 늘 낮게 나와 「아무도 안 가리킨다」가 된다. (2026-10-23)
const 가리키나 = (링크글, 제목) => {
  const A = 조각(링크글); const B = 조각(제목);
  if (!A.size || !B.size) return 0;
  let c = 0;
  A.forEach((x) => { if (B.has(x)) c += 1; });
  return c / A.size;
};

// 블로그에 이미 올라간 글 제목
const 올라간것 = [];
for (let p = 1; p <= 4; p += 1) {
  const t = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${p}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
    { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
  const 전 = 올라간것.length;
  for (const m of t.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
    올라간것.push([m[1], decodeURIComponent(m[2].replace(/\+/g, ' '))]);
  }
  if (올라간것.length === 전) break;
}
console.log(`  블로그에 글 ${올라간것.length}편이 올라가 있습니다.\n`);

// 원고를 모은다
const 원고 = [];
for (const d of fs.readdirSync(뿌리).sort()) {
  const p = path.join(뿌리, d, 'post.md');
  if (!fs.existsSync(p)) continue;
  const raw = fs.readFileSync(p, 'utf8');
  const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const 겹침 = 올라간것.find(([, t]) => 닮음(제목, t) >= 0.6);
  원고.push({ d, 제목, raw, 이미: 겹침 ? 겹침[0] : null });
}

// 남이 몇 번 가리키나 — 많이 가리키는 글부터 올린다
const 가리킴 = new Map();
for (const x of 원고) {
  for (const m of x.raw.matchAll(/\[([^\]]+)\]\(https?:\/\/(?:m\.)?blog\.naver\.com\/[^/)]+\/?\)/g)) {
    const 이름 = m[1];
    const 대상 = 원고.find((y) => 가리키나(이름, y.제목) >= 0.5);
    if (대상) 가리킴.set(대상.d, (가리킴.get(대상.d) || 0) + 1);
  }
}

const 점수 = (x) => {
  try {
    const out = execFileSync('node', ['naver-blog/blog.mjs', '검사', x.d], { encoding: 'utf8' });
    const m = out.match(/(발행 가능|고칠 것 있음) · (\d+)점/);
    return { 통과: m && m[1] === '발행 가능', 점: m ? Number(m[2]) : 0 };
  } catch { return { 통과: false, 점: 0 }; }
};

const 줄 = 원고.filter((x) => !x.이미).map((x) => ({ ...x, 가리킴: 가리킴.get(x.d) || 0, ...점수(x) }))
  .sort((a, b) => b.가리킴 - a.가리킴 || b.점 - a.점);

console.log(`  이미 올라간 원고 ${원고.filter((x) => x.이미).length}편은 건너뜁니다.\n`);
console.log('  올릴 차례:');
for (const x of 줄) {
  console.log(`   ${x.통과 ? '●' : '○'} ${x.d.padEnd(28)} ${String(x.점).padStart(3)}점 · 남이 ${x.가리킴}번 가리킴  ${x.제목.slice(0, 26)}`);
}
if (!적용) { console.log('\n  실제로 올리려면 --적용 을 붙이세요.'); process.exit(0); }

let 올림 = 0;
for (const x of 줄) {
  if (올림 >= 몇개) break;
  const 지금 = 점수(x);                 // 앞 글이 올라가 링크가 풀렸을 수 있다
  if (!지금.통과) { console.log(`  – ${x.d} ${지금.점}점 — 아직 통과 못 해 건너뜁니다`); continue; }
  console.log(`\n  ▶ ${x.d} 올립니다…`);
  try {
    execFileSync('node', ['naver-blog/blog.mjs', '발행', x.d],
      { stdio: 'inherit', env: { ...process.env, NAVER_HEADLESS: '0' } });
    올림 += 1;
    execFileSync('node', ['naver-blog/link-fix.mjs', '--적용'], { stdio: 'pipe' });
    console.log('    링크를 다시 이었습니다.');
  } catch (e) {
    console.log(`    ✗ 실패 — ${String(e.message).split('\n')[0].slice(0, 70)}`);
  }
}
console.log(`\n  ${올림}편 올렸습니다.`);
