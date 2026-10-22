#!/usr/bin/env node
// 올릴 것을 publish/queue/ 에 떨어뜨리면 알아서 올라간다.
//
//   node publish/watch.mjs            # 계속 지켜보기
//   node publish/watch.mjs --once     # 지금 쌓인 것만 처리하고 끝
//   node publish/watch.mjs --dry      # 시험
//
// 설명글은 두 가지 방법으로 붙일 수 있다.
//   1) 파일과 같은 이름의 .txt  (사진.jpg → 사진.txt)
//   2) 글만 올릴 땐 .md 나 .txt 파일 하나만 두면 그게 본문
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publish } from './lib/engine.mjs';
import { kindOf } from './lib/media.mjs';
import { say, ok, dim, warn, bad } from './lib/log.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const QUEUE = path.join(ROOT, 'queue');
const SENT = path.join(ROOT, 'sent');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const dry = process.argv.includes('--dry');
const once = process.argv.includes('--once');

const isSidecar = (f) => /\.(txt|md)$/i.test(f);
const stable = new Map();

function toFor(kind) {
  const r = (CFG.rules || []).find((x) => x.when === kind);
  return (r && r.to) || CFG.to || 'all';
}

function group() {
  if (!fs.existsSync(QUEUE)) fs.mkdirSync(QUEUE, { recursive: true });
  const files = fs.readdirSync(QUEUE).filter((f) => !f.startsWith('.'));
  const media = files.filter((f) => !isSidecar(f));
  const jobs = [];

  if (media.length) {
    // 같은 날 같은 묶음으로 보고 한 번에 올린다(캐러셀·앨범)
    const used = new Set();
    for (const m of media) {
      if (used.has(m)) continue;
      const base = m.replace(/\.[^.]+$/, '');
      const side = files.find((f) => isSidecar(f) && f.replace(/\.[^.]+$/, '') === base);
      used.add(m); if (side) used.add(side);
      const text = side ? fs.readFileSync(path.join(QUEUE, side), 'utf8').trim() : base.replace(/[_-]+/g, ' ');
      jobs.push({ files: [path.join(QUEUE, m)], text, kind: kindOf(m), cleanup: [m, side].filter(Boolean) });
    }
  }
  // 짝 없는 글 파일 = 글만 올리기
  for (const f of files.filter(isSidecar)) {
    const base = f.replace(/\.[^.]+$/, '');
    if (media.some((m) => m.replace(/\.[^.]+$/, '') === base)) continue;
    const text = fs.readFileSync(path.join(QUEUE, f), 'utf8').replace(/^---[\s\S]*?---\n/, '').trim();
    if (text) jobs.push({ files: [], text, kind: 'text', cleanup: [f] });
  }
  return jobs;
}

async function run() {
  const jobs = group();
  if (!jobs.length) return 0;
  for (const j of jobs) {
    // 아직 복사 중인 파일은 건너뛴다.
    // 3초보다 오래된 파일은 이미 다 들어온 것으로 본다(--once 에서도 바로 처리됨).
    let waiting = false;
    for (const f of j.files) {
      const st = fs.statSync(f);
      const settled = Date.now() - st.mtimeMs > 3000;
      if (!settled && stable.get(f) !== st.size) { stable.set(f, st.size); waiting = true; }
    }
    if (waiting) { say(dim('  아직 들어오는 중… 다음 바퀴에 올립니다.')); continue; }
    say(`\n  ${dim(new Date().toLocaleTimeString('ko-KR'))}  ${j.kind}  ${j.files.map((f) => path.basename(f)).join(', ') || '글만'}`);
    const res = await publish({ text: j.text, files: j.files, to: toFor(j.kind), tags: CFG.tags, link: CFG.link, dry });
    const good = res.some((r) => r.ok);
    if (!dry && good) {
      const day = path.join(SENT, new Date().toISOString().slice(0, 10));
      fs.mkdirSync(day, { recursive: true });
      for (const f of j.cleanup) fs.renameSync(path.join(QUEUE, f), path.join(day, f));
      say('  ' + ok('보관함으로 옮겼어요 → sent/' + path.basename(day)));
    } else if (!good) {
      say('  ' + warn('올라간 곳이 없어 큐에 그대로 둡니다.'));
    }
  }
  return jobs.length;
}

say(dim(`\n  큐를 지켜봅니다: ${QUEUE}`));
say(dim('  여기에 사진·영상·글 파일을 넣으면 알아서 올라갑니다. (Ctrl+C 로 종료)\n'));
await run();
if (once) process.exit(0);
setInterval(() => run().catch((e) => say(bad('  오류: ' + e.message))), 5000);
