// publish/.env 를 읽는다. 의존성 없이.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let cache = null;
export function env() {
  if (cache) return cache;
  cache = { ...process.env };
  const f = path.join(ROOT, '.env');
  if (fs.existsSync(f)) {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!cache[k]) cache[k] = v;
    }
  }
  return cache;
}

/** 이 채널이 쓸 준비가 됐는지 — 빠진 키를 돌려준다 */
export function missing(keys) {
  const e = env();
  return keys.filter((k) => !e[k]);
}
