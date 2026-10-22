// 사진·영상 다루기.
//  - 메타(인스타·스레드)와 틱톡은 "공개 URL"을 요구한다. 로컬 파일을 그냥 못 올린다.
//  - 이 저장소는 이미 gh-pages 브랜치로 이미지를 호스팅해 왔다(sns: host image …).
//    그 방식을 그대로 자동화한다: 파일을 gh-pages 의 /sns/ 로 올리고 공개 주소를 돌려준다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = 'https://hyun-arch.github.io';

const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.webm']);

export function kindOf(file) {
  const e = path.extname(file).toLowerCase();
  if (IMAGE.has(e)) return 'image';
  if (VIDEO.has(e)) return 'video';
  return 'file';
}

export function inspect(file) {
  // 이미 웹에 올라가 있는 주소면 그대로 쓴다(또 올릴 필요 없다)
  if (/^https?:\/\//.test(file)) {
    const name = file.split('/').pop().split('?')[0];
    return { path: null, name, kind: kindOf(name), bytes: 0, mb: 0, url: file, hosted: true };
  }
  if (!fs.existsSync(file)) throw new Error('파일이 없어요: ' + file);
  const st = fs.statSync(file);
  return { path: path.resolve(file), name: path.basename(file), kind: kindOf(file), bytes: st.size,
           mb: +(st.size / 1024 / 1024).toFixed(1) };
}

const git = (args, opts = {}) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', ...opts }).trim();

/**
 * 파일을 gh-pages 의 /sns/ 로 올리고 공개 주소를 돌려준다.
 * dry 면 올리지 않고 주소만 계산한다.
 */
// gh-pages 는 push 직후 바로 안 뜬다. 30~60초 걸린다.
// 기다리지 않고 인스타에 넘기면 인스타가 404 HTML 을 받아
// 「Only photo or video can be accepted as media type.」를 돌려준다. (2026-10-23 당함)
export async function waitUntilLive(url, { 최대 = 120000 } = {}) {
  const 끝 = Date.now() + 최대;
  while (Date.now() < 끝) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.ok && /^(image|video)\//.test(r.headers.get('content-type') || '')) return true;
    } catch { /* 아직 안 떴다 */ }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

export function hostPublicly(file, { dry = false } = {}) {
  const m = inspect(file);
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const safe = m.name.replace(/[^\w.\-]/g, '_');
  const rel = `sns/${stamp}_${safe}`;
  const url = `${SITE}/${rel}`;
  if (dry) return { ...m, url, hosted: false };

  const work = path.join(REPO, '.gh-pages-work');
  try {
    git(['fetch', 'origin', 'gh-pages']);
    if (!fs.existsSync(work)) git(['worktree', 'add', work, 'origin/gh-pages', '--detach']);
    else git(['-C', work, 'fetch', 'origin', 'gh-pages']);
    git(['-C', work, 'checkout', '-B', 'gh-pages', 'origin/gh-pages']);
    const dest = path.join(work, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(m.path, dest);
    git(['-C', work, 'add', rel]);
    git(['-C', work, 'commit', '-m', `sns: host ${m.kind} ${path.basename(rel)}`]);
    git(['-C', work, 'push', 'origin', 'gh-pages']);
  } catch (e) {
    throw new Error('gh-pages 로 올리지 못했어요: ' + (e.stderr || e.message));
  }
  return { ...m, url, hosted: true };
}

/** 채널이 요구하는 한도에 맞는지 확인 */
export function checkAgainst(caps, media) {
  const out = [];
  for (const m of media) {
    if (m.kind === 'image' && !caps.image) out.push(`${m.name}: 이 채널은 사진을 안 받아요`);
    if (m.kind === 'video' && !caps.video) out.push(`${m.name}: 이 채널은 영상을 안 받아요`);
    if (caps.maxMediaMB && m.mb > caps.maxMediaMB) out.push(`${m.name}: ${m.mb}MB — 한도 ${caps.maxMediaMB}MB 초과`);
  }
  if (caps.maxMedia && media.length > caps.maxMedia) out.push(`파일 ${media.length}개 — 한 번에 ${caps.maxMedia}개까지`);
  return out;
}
