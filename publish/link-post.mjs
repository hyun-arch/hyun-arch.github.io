#!/usr/bin/env node
// 이미 올라간 네이버 글의 **링크**를 SNS 로 내보낸다.
//
//   node publish/link-post.mjs 224187039532 224186545883 --to threads,instagram
//   node publish/link-post.mjs https://blog.naver.com/ianlove80/224179139313 --dry
//
// one-post.mjs 와 다른 점 —
//   one-post 는 「내 폴더에 있는 글」을 올린다(post.md 가 있어야 한다).
//   이건 「이미 네이버에 있는 글」을 og 태그만 읽어 올린다. 원고가 없어도 된다.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
// indexOf 가 -1 이면 args[0] 을 집어 온다. 반드시 includes 로 먼저 막는다. (2026-10-23 당함)
const 옵션 = (이름, 기본) => (args.includes(이름) ? args[args.indexOf(이름) + 1] : 기본);
const to = 옵션('--to', 'threads').split(',');
const 블로그 = 옵션('--blog', 'ianlove80');
const 꼬리 = 옵션('--tag', '');
const 대상 = args.filter((a) => /^(\d{9,}|https?:\/\/)/.test(a) && !a.startsWith('--'));
if (!대상.length) {
  console.log('쓰는 법: node publish/link-post.mjs <글ID|URL> … [--to threads,instagram] [--blog 아이디] [--tag "#여행 #유럽"] [--dry]');
  process.exit(1);
}

const 뜯기 = (s, re) => (s.match(re) || [, ''])[1];
const 풀기 = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

async function 읽기(id) {
  const url = `https://blog.naver.com/${블로그}/${id}`;
  const html = await fetch(`https://m.blog.naver.com/${블로그}/${id}`, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  }).then((r) => r.text());
  // 본문은 모바일 페이지에 없다(자바스크립트로 그린다). PostView 가 서버에서 그려 준다.
  const 본문html = await fetch(
    `https://blog.naver.com/PostView.naver?blogId=${블로그}&logNo=${id}`,
    { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
  const og = (p) => 풀기(뜯기(html, new RegExp(`<meta property="og:${p}" content="([^"]*)"`)));
  const 제목 = og('title') || 풀기(뜯기(html, /<title>([^<]*)<\/title>/));
  if (!제목) throw new Error(`제목을 못 읽었습니다 (${id}) — 비공개 글이거나 삭제됐을 수 있습니다`);

  // og:description 은 못 믿는다. 네이버는 복사해 쓴 글에서 **앞 글의 설명이 그대로** 남아 있다.
  //   224187039532(파리 글)의 og:description 이 「이탈리아 여행을…」이었다. (2026-10-23 실측)
  // 그래서 본문 첫 문단을 직접 읽고, 그게 안 되면 og 로 내려간다.
  const 시작 = 본문html.indexOf('se-main-container');
  const 본문 = 시작 < 0 ? [] : 풀기(본문html.slice(시작, 시작 + 90000)
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, '\n')).split('\n').map((x) => x.trim())
    .filter((x) => x.length > 25 && !/^#/.test(x));
  const og설명 = og('description');
  const 핵심 = (제목.match(/[가-힣A-Za-z]{2,}/g) || []).slice(0, 4);
  const og맞나 = og설명 && 핵심.some((w) => og설명.includes(w));
  const 설명 = 본문[0] || (og맞나 ? og설명 : '');
  return { id, url, 제목, 설명, 그림: og('image') };
}

const 짧게 = (s, n) => (s && s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s || '');

function 글만들기(g, ch) {
  const 소개 = 짧게(g.설명, ch === 'threads' ? 240 : 400);
  return [g.제목, '', 소개, '', g.url, 꼬리 ? `\n${꼬리}` : '']
    .filter((x) => x !== '').join('\n').trim();
}

async function 그림받기(g) {
  if (!g.그림) return null;
  // og:image 의 ?type= 은 건드리지 않는다. w800 으로 바꾸면 404 가 온다. (2026-10-23 당함)
  // referer 가 없으면 네이버가 막는다.
  const buf = Buffer.from(await fetch(g.그림, {
    headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://blog.naver.com/' },
  }).then((r) => r.arrayBuffer()));
  if (buf.length < 1000) return null;
  const p = path.join(os.tmpdir(), `link-${g.id}.jpg`);
  fs.writeFileSync(p, buf);
  return p;
}

const 글들 = [];
for (const a of 대상) {
  const id = a.replace(/^.*\/(\d{9,}).*$/, '$1').replace(/\D/g, '');
  try { 글들.push(await 읽기(id)); }
  catch (e) { console.log(`  ✗ ${id} — ${e.message}`); }
}
if (!글들.length) { console.log('읽은 글이 없습니다.'); process.exit(1); }

for (const g of 글들) {
  console.log(`\n  ${g.제목}`);
  console.log(`  ${g.url}${g.그림 ? ' · 대표사진 있음' : ' · 대표사진 없음'}`);
  for (const ch of to) {
    const t = 글만들기(g, ch);
    console.log(`  ── ${ch} (${t.length}자) ──`);
    console.log(t.split('\n').map((l) => '    ' + l).join('\n'));
  }
}
if (dry) { console.log('\n  미리보기만 했습니다. 올리려면 --dry 를 빼세요.\n'); process.exit(0); }

const { publish } = await import('./lib/engine.mjs');
for (const g of 글들) {
  const 사진 = to.includes('instagram') ? await 그림받기(g) : null;
  for (const ch of to) {
    const t = 글만들기(g, ch);
    if (ch === 'instagram' && !사진) { console.log(`    ✗ instagram — 대표사진이 없어 건너뜁니다 (${g.id})`); continue; }
    try {
      // 엔진이 받는 이름은 media 가 아니라 **files** 다. media 로 주면 사진이
      // 통째로 무시되고 「사진이 있어야 해요」만 뜬다. (2026-10-23 당함)
      const r = await publish({ text: t, files: ch === 'instagram' ? [사진] : [], to: [ch] });
      const 건너뜀 = (r || []).find((x) => x.skipped || x.ok === false);
      if (건너뜀) console.log(`    ✗ ${ch} — ${[].concat(건너뜀.skipped || 건너뜀.error)[0]}`);
      else console.log(`    ✓ ${ch} — ${g.id}`);
    } catch (e) {
      console.log(`    ✗ ${ch} — ${e.message.split('\n')[0].slice(0, 70)}`);
    }
  }
}
