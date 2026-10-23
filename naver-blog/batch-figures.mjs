#!/usr/bin/env node
// 그림이 없는 원고에 **소제목 카드**를 한꺼번에 만들어 박는다.
//
//   node naver-blog/batch-figures.mjs            무엇을 할지만 보여 준다
//   node naver-blog/batch-figures.mjs --적용
//
// 왜 (2026-10-23) —
//   원고 24편 중 17편이 「이미지 0장」으로 막혀 있었다. 한 편씩 돌리면 하루가 간다.
//   브랜드는 글 내용에서 고른다 — 두피/샴푸는 릴라이, 손은 메디커스텀,
//   진단기/측정기는 아람휴비스(B2B), 나머지 피부는 엘라피엘.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 적용 = process.argv.includes('--적용');
const 뿌리 = path.resolve('naver-blog/posts');

// 제목을 먼저 본다. 본문까지 섞어 보면 「반복 트러블」이 본문에 간호사가
// 나왔다고 메디커스텀이 되고, 「핸드크림 타이밍」이 측정 얘기 때문에 B2B 가 된다.
// 글이 누구에게 가는지는 **제목이 정한다**. (2026-10-23)
const 고르기 = (t) => {
  if (/진단기|측정기|살롱|미용실|헤어샵|에스테틱|피부샵|도입/.test(t)) return 'b2b';
  if (/핸드크림|손톱|손등|손끝|주부습진|간호사/.test(t)) return 'medicustom';
  if (/두피|샴푸|비듬|모발|탈모|헤어|각질.*어깨|하얀 가루/.test(t)) return 'relai';
  return null;
};
const 브랜드고르기 = (제목, 본문) =>
  고르기(제목) || 고르기(본문.slice(0, 600)) || 'ellapiel';

// 그림을 소제목 밑 첫 문단 뒤에 박는다
const 박기 = (글폴더) => {
  const p = path.join(글폴더, 'post.md');
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes('![](')) return 0;
  const 그림 = fs.readdirSync(글폴더).filter((f) => /^fig-\d+\.png$/.test(f)).sort();
  const 줄 = s.split('\n');
  const 나옴 = [];
  let 쓴것 = 0; let 표지 = false;
  for (let i = 0; i < 줄.length; i += 1) {
    나옴.push(줄[i]);
    if (!표지 && i > 1 && 줄[i].trim() && !줄[i].startsWith('#')
        && fs.existsSync(path.join(글폴더, 'cover.png'))) {
      나옴.push('', '![](cover.png)');
      표지 = true;
    }
    if (/^##\s/.test(줄[i]) && !/^##\s+정리/.test(줄[i])) {
      let j = i + 1;
      while (j < 줄.length && (!줄[j].trim() || 줄[j].startsWith('|'))) { 나옴.push(줄[j]); j += 1; }
      if (j < 줄.length) {
        나옴.push(줄[j]);
        if (쓴것 < 그림.length) { 나옴.push('', `![](${그림[쓴것]})`); 쓴것 += 1; }
        i = j;
      }
    }
  }
  fs.writeFileSync(p, 나옴.join('\n'));
  return 쓴것 + (표지 ? 1 : 0);
};

const 할것 = [];
for (const d of fs.readdirSync(뿌리).sort()) {
  const 폴더 = path.join(뿌리, d);
  const p = path.join(폴더, 'post.md');
  if (!fs.existsSync(p)) continue;
  const 있는그림 = fs.readdirSync(폴더).filter((f) => /\.(png|jpe?g)$/i.test(f)).length;
  if (있는그림 >= 5) continue;
  const raw = fs.readFileSync(p, 'utf8');
  const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ''])[1];
  const 소제목수 = (raw.match(/^##\s+/gm) || []).length;
  할것.push({ d, 폴더, 제목, 소제목수, 있는그림, brand: 브랜드고르기(제목, raw) });
}

console.log(`  그림이 모자란 원고 ${할것.length}편\n`);
for (const x of 할것) {
  console.log(`  ${x.d.padEnd(28)} ${x.brand.padEnd(11)} 지금 ${x.있는그림}장 · 소제목 ${x.소제목수}개  ${x.제목.slice(0, 30)}`);
}
if (!적용) { console.log('\n  실제로 만들려면 --적용 을 붙이세요.'); process.exit(0); }

let 만듦 = 0; let 박음 = 0;
for (const x of 할것) {
  try {
    execFileSync('node', ['naver-blog/make-figures.mjs', x.폴더, x.brand], { stdio: 'pipe' });
    const n = 박기(x.폴더);
    만듦 += 1; 박음 += n;
    console.log(`  ✓ ${x.d}  그림 ${n}장 박음`);
  } catch (e) {
    console.log(`  ✗ ${x.d}  ${String(e.stderr || e.message).slice(0, 80)}`);
  }
}
console.log(`\n  원고 ${만듦}편 · 그림 ${박음}장`);
