#!/usr/bin/env node
// 스레드에 글을 이어서 올린다 (1/4 → 2/4 → …). 한 편이 500자를 넘을 때 쓴다.
//
//   node publish/threads-chain.mjs <조각파일.md> [--dry]
//
// 조각파일 형식 — 줄 하나에 `---` 만 있으면 거기서 나뉜다.
// 두 번째 조각부터는 앞 글의 답글로 달려 한 타래가 된다.
import fs from 'node:fs';
import { env } from './lib/env.mjs';

const G = 'https://graph.threads.net/v1.0';
const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) { console.log('조각 파일을 주세요.'); process.exit(1); }

const parts = fs.readFileSync(file, 'utf8')
  .split(/^---$/m).map((s) => s.trim()).filter(Boolean);

const e = env();
const uid = e.THREADS_USER_ID, tok = e.THREADS_ACCESS_TOKEN;
if (!uid || !tok) { console.log('THREADS_USER_ID / THREADS_ACCESS_TOKEN 이 없습니다.'); process.exit(1); }

const j = async (url, opt) => {
  const r = await fetch(url, opt);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
};

console.log(`\n  ${parts.length}조각`);
parts.forEach((p, i) => console.log(`    ${i + 1}/${parts.length}  ${[...p].length}자` +
  ([...p].length > 500 ? '  ⚠ 500자 초과' : '')));

if (parts.some((p) => [...p].length > 500)) { console.log('\n  500자 넘는 조각이 있어 멈춥니다.\n'); process.exit(1); }
if (dry) { console.log('\n  (보기만 했습니다. 올리려면 --dry 를 빼세요)\n'); process.exit(0); }

// 올리기 전에 최근 글을 읽어 같은 첫 문장이 이미 있는지 본다.
// 왜 넣었나: 첫 실행이 중간에 터졌는데 3편까지는 올라가 있었다. 「실패했다」로 읽고
// 다시 돌려서 같은 글을 두 번 올렸다. 터졌다고 아무것도 안 된 게 아니다. (2026-10-20 실측)
{
  const head = parts[0].split('\n')[0].trim().slice(0, 20);
  try {
    const r = await j(`${G}/${uid}/threads?fields=id,text&limit=10&access_token=${tok}`);
    const dup = (r.data || []).filter((x) => (x.text || '').includes(head));
    if (dup.length) {
      console.log(`\n  ⚠ 같은 첫 문장으로 시작하는 글이 이미 ${dup.length}개 있습니다:`);
      dup.forEach((x) => console.log(`     ${x.id}  ${(x.text || '').replace(/\n/g, ' ').slice(0, 40)}`));
      console.log('\n  이전 실행이 중간까지 올렸을 수 있습니다. 확인하고 지운 뒤 다시 돌리세요.');
      console.log('  그래도 올리려면 --force 를 붙이세요.\n');
      if (!process.argv.includes('--force')) process.exit(1);
    }
  } catch { /* 확인에 실패해도 올리는 건 막지 않는다 */ }
}

let prev = null;
const urls = [];
for (let i = 0; i < parts.length; i++) {
  const body = { media_type: 'TEXT', text: parts[i], access_token: tok };
  if (prev) body.reply_to_id = prev;          // 두 번째부터 앞 글의 답글로
  const c = await j(`${G}/${uid}/threads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  // 만든 직후에는 아직 준비가 안 돼 「resource does not exist」가 난다.
  // 잠깐 기다렸다가, 안 되면 몇 번 더 두드린다. (2026-10-20 실측)
  let pub = null, lastErr = null;
  for (let n = 0; n < 6; n++) {
    await new Promise((r) => setTimeout(r, n === 0 ? 4000 : 5000));
    try {
      pub = await j(`${G}/${uid}/threads_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: c.id, access_token: tok }),
      });
      break;
    } catch (err) { lastErr = err; process.stdout.write('.'); }
  }
  if (!pub) throw new Error(`${i + 1}번째 글 게시 실패 — ${lastErr?.message}`);
  prev = pub.id;
  const url = `https://www.threads.net/@${e.THREADS_USERNAME || 'me'}/post/${pub.id}`;
  urls.push(url);
  console.log(`  ${i + 1}/${parts.length} 올렸습니다  ${pub.id}`);
  await new Promise((r) => setTimeout(r, 2500));   // 연속 호출 간격
}
console.log(`\n  첫 글 주소: ${urls[0]}\n`);
