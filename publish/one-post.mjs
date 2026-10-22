#!/usr/bin/env node
// 글 한 편으로 모든 채널에 — 블로그 글을 SNS 길이에 맞게 줄여 같이 올린다.
//
//   node publish/one-post.mjs naver-blog/posts/2026-10-22-간호사-핸드크림
//   node publish/one-post.mjs <글폴더> --to threads,linkedin
//   node publish/one-post.mjs <글폴더> --dry
//
// 왜 —
//   블로그 글은 2,000자가 넘고 SNS 는 짧아야 한다. 통째로 올리면
//   링크드인은 거부하고(1,353자 거부 · 753자 통과 — 2026-10-20 실측)
//   스레드는 잘린다.
//   그래서 글에서 「무엇을 다뤘나」만 뽑아 각 채널 길이에 맞춘다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const to = (args[args.indexOf('--to') + 1] || 'threads,linkedin').split(',');
const dry = args.includes('--dry');
if (!dir) { console.log('쓰는 법: node publish/one-post.mjs <글폴더> [--to a,b] [--dry]'); process.exit(1); }

const 글 = path.resolve(ROOT, dir, 'post.md');
if (!fs.existsSync(글)) { console.log('글이 없습니다:', 글); process.exit(1); }

const raw = fs.readFileSync(글, 'utf8');
const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
const 본문 = raw.replace(/^#\s+.+$/m, '');

// 소제목 = 이 글이 답하는 질문들. SNS 에는 이것만 보여 준다.
const 소제목 = [...본문.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim())
  .filter((t) => !/^정리$/.test(t));

// 첫 문단 — 글의 한 줄 소개
const 첫문단 = (본문.split(/\n{2,}/).find((p) =>
  p.trim() && !/^[#!>|-]/.test(p.trim())) || '').trim().replace(/\*\*/g, '');

const 링크 = (() => {
  const pub = path.resolve(ROOT, dir, 'published.json');
  try { return JSON.parse(fs.readFileSync(pub, 'utf8')).url || ''; } catch { return ''; }
})();

const 사진 = fs.readdirSync(path.resolve(ROOT, dir))
  .filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
  .map((f) => path.resolve(ROOT, dir, f));

// 채널별 본문 — 길이가 다르다
const 짧게 = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s\S*$/, '') + '…');
const 공통태그 = '#아람휴비스 #두피진단 #측정으로시작하는관리';

const 본문들 = {
  threads: [
    제목,
    '',
    짧게(첫문단, 300),
    '',
    ...소제목.slice(0, 4).map((t) => `· ${t}`),
    링크 ? `\n${링크}` : '',
    '',
    공통태그,
  ].filter((x) => x !== undefined).join('\n'),

  linkedin: [
    제목,
    '',
    짧게(첫문단, 400),
    '',
    '이 글에서 다룬 것',
    ...소제목.slice(0, 5).map((t) => `· ${t}`),
    링크 ? `\n${링크}` : '',
    '',
    공통태그,
  ].join('\n'),

  instagram: [
    제목,
    '',
    짧게(첫문단, 500),
    '',
    ...소제목.slice(0, 5).map((t) => `· ${t}`),
    '',
    공통태그,
  ].join('\n'),
};

console.log(`\n  ${제목}`);
console.log(`  소제목 ${소제목.length}개 · 사진 ${사진.length}장${링크 ? ' · 링크 있음' : ' · 링크 없음(미발행)'}\n`);

for (const ch of to) {
  const t = 본문들[ch] || 본문들.threads;
  console.log(`  ── ${ch} (${t.length}자) ──`);
  console.log(t.split('\n').map((l) => '    ' + l).join('\n'));
  console.log('');
}

if (dry) { console.log('  미리보기만 했습니다. 올리려면 --dry 를 빼세요.\n'); process.exit(0); }

const { publish } = await import('./lib/engine.mjs');
for (const ch of to) {
  const t = 본문들[ch] || 본문들.threads;
  // 엔진 인자 이름은 files 다. media 로 주면 조용히 사라진다. (2026-10-23 고침)
  const files = ch === 'instagram' ? 사진.slice(0, 1) : [];
  console.log(`  ${ch} 올리는 중…`);
  try {
    const r = await publish({ text: t, files, to: [ch] });
    const 건너뜀 = (r || []).find((x) => x.skipped);
    if (건너뜀) console.log(`    ✗ ${ch} — ${[].concat(건너뜀.skipped || 건너뜀.error)[0]}`);
    else console.log(`    ✓ ${ch}`);
  } catch (e) {
    console.log(`    ✗ ${ch} — ${e.message.split('\n')[0].slice(0, 60)}`);
  }
}
