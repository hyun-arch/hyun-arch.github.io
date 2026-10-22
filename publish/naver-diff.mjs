#!/usr/bin/env node
// 발행된 글을 **원고와 글자 단위로 맞춰 본다**.
//
//   node publish/naver-diff.mjs 224450821499 naver-blog/posts/2026-10-22-지성두피
//   node publish/naver-diff.mjs --전부        제목으로 원고를 찾아 전부 맞춰 본다
//
// 왜 만들었나 (2026-10-23) —
//   「## 몇 개 · ** 몇 개」만 세고 「깨끗하다」고 말했다.
//   그 사이 타이핑이 「확인합니다」를 「확인합니니다」로 바꿔 놨는데 못 봤다.
//   **세는 것과 맞춰 보는 것은 다르다.** 원고가 정답지다.
import fs from 'node:fs';
import path from 'node:path';
import { toNaver } from '../naver-blog/lib/tonaver.mjs';

const args = process.argv.slice(2);
const blogId = args.includes('--blog') ? args[args.indexOf('--blog') + 1] : 'ianlove80';
const 전부 = args.includes('--전부');
const UA = { 'user-agent': 'Mozilla/5.0' };
// 엔티티는 이름꼴(&quot;)만 오지 않는다. 숫자꼴(&#39; · &#x27;)도 오고,
// 네이버는 &amp;#x27; 처럼 **두 번 싸서** 보내기도 한다. 한 번만 풀면 &#x27; 가 그대로 남아
// 멀쩡한 문장을 「원고와 다르다」고 세게 된다. 그래서 두 번 푼다. (2026-10-23 당함)
const 한번풀기 = (s) => s
  .replace(/&amp;/g, '&')
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/​/g, '');
const 풀기 = (s) => 한번풀기(한번풀기(s));

const 납작 = (x) => x.replace(/\s+/g, '').replace(/[·•]/g, '');

async function 발행본(id) {
  const html = await fetch(`https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${id}`,
    { headers: UA }).then((r) => r.text());
  const i = html.indexOf('se-main-container');
  if (i < 0) return null;
  // 문단을 가르는 것은 블록 태그다. a·span·strong 같은 **줄 안의 태그로 쪼개면
  // 주소가 「https」 와 「://ellapiel.co.kr」 로 갈라진다.** (2026-10-23 당함)
  const 줄 = 풀기(html.slice(i, i + 150000)
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<\/?(p|br|li|tr|h[1-6]|section|article|figure|figcaption)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .split('\n').map((x) => x.trim()).filter(Boolean);
  // 본문 뒤에 붙는 것: 블로그 마켓 안내 · 이웃 글 목록 · 댓글 영역.
  // 이웃 글 제목까지 본문으로 세면 「원고에 없는 줄」이 쏟아진다. (2026-10-23 당함)
  // 자르는 말은 **길고 분명한 것만** 쓴다. 「댓글」 같은 짧은 말은 본문 위쪽
  // 단추에도 나와서, 첫 번째로 걸리면 본문 뒤쪽이 통째로 잘린다.
  // 그래서 「정리」가 통째로 사라진 것처럼 보였다. (2026-10-23 당함)
  const 끝 = 줄.findIndex((x) =>
    /블로그 마켓 가입|이 글에 댓글 단 블로거|글보내기 서비스 안내|이 블로그의 인기글|공감을 삭제하시겠습니까/.test(x));
  return 줄.slice(1, 끝 < 0 ? 줄.length : 끝).filter((x) => !/^#\S/.test(x));  // 태그줄 제외
}

async function 글목록() {
  const m = new Map();
  for (let p = 1; p <= 4; p += 1) {
    const t = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${p}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
      { headers: UA }).then((r) => r.text()).catch(() => '');
    const 전 = m.size;
    for (const x of t.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
      m.set(x[1], decodeURIComponent(x[2].replace(/\+/g, ' ')));
    }
    if (m.size === 전) break;
  }
  return m;
}

// 제목이 글자 하나까지 같지 않다. 두 글자 조각이 얼마나 겹치나로 고른다.
const 조각 = (x) => { const n = 납작(x).replace(/[^가-힣A-Za-z0-9]/g, ''); const s = new Set();
  for (let i = 0; i + 2 <= n.length; i += 1) s.add(n.slice(i, i + 2)); return s; };
function 원고찾기(제목) {
  const 뿌리 = path.resolve('naver-blog/posts');
  if (!fs.existsSync(뿌리)) return null;
  const a = 조각(제목);
  if (!a.size) return null;
  let best = null; let 점수 = 0;
  for (const d of fs.readdirSync(뿌리)) {
    const f = path.join(뿌리, d, 'post.md');
    if (!fs.existsSync(f)) continue;
    const h1 = (fs.readFileSync(f, 'utf8').match(/^#\s+(.+)$/m) || [, ''])[1] || '';
    const b = 조각(h1);
    if (!b.size) continue;
    let 겹침 = 0;
    a.forEach((x) => { if (b.has(x)) 겹침 += 1; });
    const 비율 = 겹침 / Math.max(a.size, b.size);
    if (비율 > 점수) { 점수 = 비율; best = path.join(뿌리, d); }
  }
  return 점수 >= 0.6 ? best : null;
}

// 네이버가 모든 글 밑에 붙이는 단추·안내 글자 — 본문이 아니다
const UI단어 = new Set(['태그', '취소', '확인', '댓글', '쓰기', '인쇄', '댓글쓰기', '이전', '다음',
  '전체', '검색', '공감', '수정', '삭제', '이 블로그', '카테고리 글', '전체글 보기', '글 목록',
  '글 제목', '작성일', '화면 최상단으로 이동', '글 검색', '이웃추가', '서로이웃']);

async function 맞춰보기(id, 글폴더, 제목 = '') {
  const 올라간것 = await 발행본(id);
  if (!올라간것) { console.log(`  ? ${id} 본문을 못 읽었습니다`); return false; }
  if (!글폴더) {
    console.log(`  – ${id} ${제목.slice(0, 36)} — 원고를 못 찾아 건너뜁니다`);
    return null;
  }
  const { blocks } = toNaver(fs.readFileSync(path.join(글폴더, 'post.md'), 'utf8'));
  const 원고줄 = blocks.filter((b) => b.type === 'text')
    .flatMap((b) => String(b.text).split('\n')).map((x) => x.trim()).filter(Boolean);

  // 줄 모양은 달라도 된다 — 변환기는 주소를 홀로 두고, 고친 글은 줄 안에 둔다.
  // 그래서 **줄끼리 맞추지 않고 글 전체를 이어 붙여 부분일치로** 본다. (2026-10-23)
  // 주소는 줄 안에 있기도 하고 홀로 있기도 하다(변환기는 홀로 둔다).
  // 그래서 **글자 비교에서는 주소를 빼고**, 주소는 따로 「다 있나」만 본다. (2026-10-23)
  // 주소 글자만 집는다. [^\s)]+ 로 집으면 뒤에 붙은 한글(…ianlove80「이니」)까지
  // 주소로 먹어서, 멀쩡한 글자가 사라진 것처럼 보인다. (2026-10-23 당함)
  const 주소꼴 = /https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'*+;=%-]+/g;
  // 주소를 빼면 「(…)」 가 빈 괄호로 남는다. 그것 때문에 다르다고 세면 안 된다.
  const 주소빼기 = (x) => x.replace(주소꼴, ' ').replace(/\(\s*\)/g, ' ');
  const 원고통 = 납작(주소빼기(원고줄.join('')));
  const 발행통 = 납작(주소빼기(올라간것.join('')));
  const 주소들 = (x) => new Set((x.join(' ').match(주소꼴) || [])
    .map((u) => u.replace(/[.,)]+$/, '')));
  const 원고주소 = 주소들(원고줄); const 발행주소 = 주소들(올라간것);
  const 빠진주소 = [...원고주소].filter((u) => ![...발행주소].some((v) => v.startsWith(u) || u.startsWith(v)));

  const 빠짐 = 원고줄.filter((줄) => {
    const n = 납작(주소빼기(줄));
    return n.length > 3 && !발행통.includes(n);
  });
  const 군더더기 = 올라간것.filter((줄) => {
    const t = 줄.trim();
    if (UI단어.has(t) || t.length <= 3) return false;
    if (/^#\S/.test(t)) return false;                     // 태그줄
    if (/^https?:\/\//.test(t)) return false;              // 주소 줄
    const n = 납작(주소빼기(t));
    return n.length > 3 && !원고통.includes(n);
  });

  const 좋음 = !빠짐.length && !군더더기.length && !빠진주소.length;
  console.log(`  ${좋음 ? '✓' : '✗'} ${id} ${제목.slice(0, 34)}  원고 ${원고줄.length}줄 · 발행 ${올라간것.length}줄`);
  // 「다르다」로 끝내지 않는다. **어느 글자부터 다른지** 짚는다.
  const 닮은줄 = (줄) => {
    const n = 납작(주소빼기(줄));
    let best = null; let 점수 = 0;
    for (const p of 올라간것) {
      const m = 납작(주소빼기(p));
      let i = 0; while (i < n.length && i < m.length && n[i] === m[i]) i += 1;
      const r = i / Math.max(n.length, 1);
      if (r > 점수) { 점수 = r; best = { 글: p, 같은데까지: i, 납작: m }; }
    }
    return 점수 > 0.3 ? best : null;
  };
  for (const x of 빠짐.slice(0, 6)) {
    console.log(`       원고에 있는데 글에 없음: ${x.slice(0, 100)}`);
    const 닮 = 닮은줄(x);
    if (닮) {
      const n = 납작(주소빼기(x)); const i = 닮.같은데까지;
      console.log(`         ↳ 여기서 갈립니다 (${i}번째 글자): …${n.slice(Math.max(0, i - 12), i)}『${n.slice(i, i + 10)}』`);
      console.log(`                        글에는  : …${닮.납작.slice(Math.max(0, i - 12), i)}『${닮.납작.slice(i, i + 10)}』`);
    }
  }
  for (const x of 군더더기.slice(0, 6)) console.log(`       글에만 있음(원고와 다름): ${x.slice(0, 100)}`);
  for (const u of 빠진주소) console.log(`       원고의 주소가 글에 없음: ${u}`);
  return 좋음;
}

if (전부) {
  const 목록 = await 글목록();
  let 맞음 = 0; let 틀림 = 0; let 건너뜀 = 0;
  for (const [id, 제목] of 목록) {
    const r = await 맞춰보기(id, 원고찾기(제목), 제목);
    if (r === null) 건너뜀 += 1; else if (r) 맞음 += 1; else 틀림 += 1;
  }
  console.log(`\n  원고와 같음 ${맞음} · 다름 ${틀림} · 원고 없음 ${건너뜀}`);
} else {
  const id = args.find((a) => /^\d{9,}$/.test(a));
  const 폴더 = args.find((a) => a.includes('posts/'));
  if (!id) { console.log('쓰는 법: node publish/naver-diff.mjs <글ID> <글폴더>  또는  --전부'); process.exit(1); }
  await 맞춰보기(id, 폴더 || null, '');
}
