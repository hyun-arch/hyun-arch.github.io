#!/usr/bin/env node
// 한 줄이든 사진이든 영상이든, 한 번에 모든 SNS 로.
//
//   node publish/post.mjs --text "오늘 한 줄" --to all
//   node publish/post.mjs --media shot.jpg --text "설명" --tags 경영,AI
//   node publish/post.mjs --media reel.mp4 --title "쇼츠 제목" --to youtube,instagram,tiktok
//   node publish/post.mjs --file 글.md --to threads,x,linkedin --dry
//   node publish/post.mjs --status
import fs from 'node:fs';
import { publish, preview, status } from './lib/engine.mjs';
import { say, ok, warn, dim, bad, history } from './lib/log.mjs';

const args = process.argv.slice(2);
const val = (name, d = '') => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const has = (name) => args.includes('--' + name);
const list = (name) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith('--'); j++) out.push(args[j]);
  return out;
};

if (has('status') || !args.length) {
  say('\n  채널 상태\n');
  for (const s of status()) {
    const mark = s.ready ? ok('●') : (s.caps.manual ? dim('○') : warn('○'));
    const can = [s.caps.text && '글', s.caps.image && '사진', s.caps.video && '영상'].filter(Boolean).join('·');
    const state = s.caps.manual ? dim('초안만 만들어 둠(수동 발행)')
      : s.ready ? ok('연결됨 — 바로 올라감')
      : (s.free ? ok('무료·심사없음 · ') : '') + dim('필요: ' + s.missing.join(', '));
    say(`  ${mark} ${s.name.padEnd(14)} ${dim(can.padEnd(10))} ${state}`);
    if (!s.ready && s.note) say(dim(`      ${s.note}`));
  }
  const h = history(5);
  if (h.length) {
    say('\n  최근 발행');
    for (const r of h) say(dim(`   ${r.at.slice(0, 16).replace('T', ' ')}  ${r.channel}  ${r.ok ? '완료' : '실패 ' + (r.error || '')}`));
  }
  say('\n  ' + dim('보내기: node publish/post.mjs --text "…" --media 사진.jpg --to all') + '\n');
  process.exit(0);
}

let text = val('text');
if (val('file')) {
  const raw = fs.readFileSync(val('file'), 'utf8');
  text = raw.replace(/^---[\s\S]*?---\n/, '').trim();
}
if (!text && !list('media').length) {
  say(bad('  보낼 글도 파일도 없어요.'));
  process.exit(1);
}

if (has('preview')) {
  say('');
  for (const p of preview({ text, files: list('media'), to: val('to', 'all'),
                            link: val('link'), tags: val('tags') ? val('tags').split(',') : [] })) {
    const cap = p.limit ? `${p.count}/${p.limit}자` : `${p.count}자`;
    const head = `  ${p.name}  ${dim(cap)}${p.fits ? '' : ' ' + bad('한도 넘침')}`;
    say(head + (p.manual ? dim('  · 수동') : p.ready ? '' : dim('  · 자격 정보 없음')));
    if (p.problems.length) say('    ' + warn(p.problems.join(' · ')));
    if (p.media.length) say('    ' + dim('첨부: ' + p.media.join(', ')));
    say(p.text.split('\n').map((l) => '    ' + dim('│ ') + l).join('\n'));
    say('');
  }
  process.exit(0);
}

const res = await publish({
  text,
  files: list('media'),
  to: val('to', 'all'),
  link: val('link'),
  tags: val('tags') ? val('tags').split(',').map((s) => s.trim()).filter(Boolean) : [],
  title: val('title'),
  dry: has('dry'),
});

const done = res.filter((r) => r.ok).length;
say('\n  ' + (has('dry') ? dim('시험 끝 — 실제로는 보내지 않았어요.') : ok(`${done}곳에 올렸어요.`)) + '\n');
