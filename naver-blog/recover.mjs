#!/usr/bin/env node
// 표지(cover.png)만 다시 만든다. 본문 카드(fig-*)는 건드리지 않는다.
//
//   node naver-blog/recover.mjs            무엇을 다시 만들지만 보여 준다
//   node naver-blog/recover.mjs --적용
//
// 왜 (2026-10-23) —
//   앨범형 목록에서 썸네일이 못났다. 세 가지였다.
//     ① 한글이 단어 중간에서 잘렸다 — 「모공이 넓어 보 / 이는 진짜 이유」
//     ② 글자가 아래로 쏠려 가운데가 텅 비었다
//     ③ 제목을 고쳐 쓴 뒤라 **표지의 제목이 옛것**이었다
//   앨범형은 작게 줄여 보는 자리다. 줄여서 안 읽히면 없는 것과 같다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 적용 = process.argv.includes('--적용');
const 뿌리 = path.resolve('naver-blog/posts');

const 고르기 = (t) => {
  if (/진단기|측정기|살롱|미용실|헤어샵|에스테틱|피부샵|도입/.test(t)) return 'b2b';
  if (/핸드크림|손톱|손등|손끝|주부습진|간호사/.test(t)) return 'medicustom';
  if (/두피|샴푸|비듬|모발|탈모|헤어|하얀 가루/.test(t)) return 'relai';
  return null;
};

const 할것 = [];
for (const d of fs.readdirSync(뿌리).sort()) {
  const p = path.join(뿌리, d, 'post.md');
  if (!fs.existsSync(p)) continue;
  const raw = fs.readFileSync(p, 'utf8');
  const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  const brand = 고르기(제목) || 고르기(raw.slice(0, 600)) || 'ellapiel';
  할것.push({ d, 폴더: path.join(뿌리, d), 제목, brand });
}

console.log(`  표지를 다시 만들 글 ${할것.length}편\n`);
할것.forEach((x) => console.log(`  ${x.d.padEnd(28)} ${x.brand.padEnd(11)} ${x.제목.slice(0, 34)}`));
if (!적용) { console.log('\n  실제로 만들려면 --적용 을 붙이세요.'); process.exit(0); }

let 됨 = 0;
for (const x of 할것) {
  // cover.png 만 지우고 다시 만든다 — fig-* 는 그대로 둔다
  const c = path.join(x.폴더, 'cover.png');
  try { if (fs.existsSync(c)) fs.unlinkSync(c); } catch { /* 무시 */ }
  try {
    execFileSync('node', ['naver-blog/make-figures.mjs', x.폴더, x.brand], { stdio: 'pipe' });
    됨 += 1;
    console.log(`  ✓ ${x.d}`);
  } catch (e) {
    console.log(`  ✗ ${x.d} — ${String(e.stderr || e.message).slice(0, 70)}`);
  }
}
console.log(`\n  표지 ${됨}장을 다시 만들었습니다.`);
