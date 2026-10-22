// 내 기준을 읽고 쓰는 곳.
// 강의에서 가장 중요한 말: "기준은 내 숫자에서 나온다. 남의 기준이 아니라 내 블로그 실측이다."
// 그래서 이 파일의 숫자는 밤 루틴이 매일 고쳐 쓴다. 사람이 외울 필요가 없다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'standards.json');

export const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
export function save(s) {
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2) + '\n');
  return s;
}
export const ROOT_DIR = ROOT;
