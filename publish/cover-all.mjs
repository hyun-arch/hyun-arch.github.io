#!/usr/bin/env node
// 이미 발행된 글의 표지를 **전부** 새 것으로 바꾼다.
//
//   node publish/cover-all.mjs            무엇을 바꿀지만 보여 준다
//   node publish/cover-all.mjs --적용
//   node publish/cover-all.mjs --적용 --몇개 5
//
// 왜 (2026-10-23) —
//   앨범형 썸네일이 못났다. 표지를 다시 만들었지만 **이미 올라간 글은 옛 표지를 들고 있다.**
//   글을 지우고 다시 올리면 주소와 조회가 날아가므로, 첫 이미지만 갈아 끼운다.
//
// 가장 중요한 것 — **「대표」 표시** (2026-10-23 실측)
//   네이버는 이미지마다 대표 표시를 따로 들고 있다.
//   첫 이미지를 바꿔도 대표가 옛 이미지에 걸려 있으면 **앨범형 썸네일은 그대로다.**
//   본문만 보고 「됐다」고 하면 틀린다. og:image 까지 봐야 한다.
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
const 닮음 = (a, b) => {
  const A = 조각(a); const B = 조각(b);
  if (!A.size || !B.size) return 0;
  let c = 0; A.forEach((x) => { if (B.has(x)) c += 1; });
  return c / Math.max(A.size, B.size);
};

// 블로그에 올라간 글
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

// 원고 ↔ 올라간 글 짝짓기
const 할것 = [];
for (const d of fs.readdirSync(뿌리).sort()) {
  const md = path.join(뿌리, d, 'post.md');
  const cover = path.join(뿌리, d, 'cover.png');
  if (!fs.existsSync(md) || !fs.existsSync(cover)) continue;
  const 제목 = (fs.readFileSync(md, 'utf8').match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const 짝 = 올라간것.find(([, t]) => 닮음(제목, t) >= 0.6);
  if (!짝) continue;
  할것.push({ d, id: 짝[0], 제목, cover });
}

console.log(`  표지를 바꿀 글 ${할것.length}편\n`);
할것.forEach((x) => console.log(`  ${x.id}  ${x.제목.slice(0, 40)}`));
if (!적용) { console.log('\n  실제로 바꾸려면 --적용 을 붙이세요.'); process.exit(0); }

let 됨 = 0; const 실패 = [];
for (const x of 할것) {
  if (됨 >= 몇개) break;
  console.log(`\n▶ ${x.id} ${x.제목.slice(0, 32)}`);
  try {
    execFileSync('node', ['publish/naver-cover.mjs', x.id, x.cover],
      { stdio: 'inherit', env: { ...process.env, NAVER_HEADLESS: '0' } });
    됨 += 1;
  } catch (e) {
    실패.push([x.id, x.제목.slice(0, 24)]);
    console.log(`  ✗ 실패 — ${String(e.message).split('\n')[0].slice(0, 70)}`);
  }
}

console.log(`\n  ${됨}편 바꿨습니다. 실패 ${실패.length}편`);
실패.forEach(([id, t]) => console.log(`   ✗ ${id} ${t}`));

// 확인 — og:image 가 새 것으로 바뀌었나
console.log('\n  썸네일 확인:');
for (const x of 할것.slice(0, 됨)) {
  const html = await fetch(`https://m.blog.naver.com/${blogId}/${x.id}?r=${Date.now()}`,
    { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
  const og = (html.match(/og:image" content="([^"]*)"/) || [, ''])[1];
  console.log(`   ${x.id} ${og ? '있음' : '없음'}  ${x.제목.slice(0, 26)}`);
}
