// 발행 기록 — 무엇을 어디로 보냈고 결과가 어땠는지 한 줄씩 남긴다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG = path.join(ROOT, 'sent', 'log.jsonl');

const C = { dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', off: '\x1b[0m' };
export const say = (...a) => console.log(...a);
export const dim = (s) => C.dim + s + C.off;
export const ok = (s) => C.green + s + C.off;
export const bad = (s) => C.red + s + C.off;
export const warn = (s) => C.yellow + s + C.off;
export const info = (s) => C.blue + s + C.off;

export function record(entry) {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}

export function history(n = 20) {
  if (!fs.existsSync(LOG)) return [];
  return fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean).slice(-n).reverse();
}
