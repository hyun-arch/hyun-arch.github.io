// 글을 읽고 알맞은 카테고리로 보내고, 번호를 매긴다.
// 사람이 분류를 고를 일이 없게 하는 게 목적이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, '../setup/categories.json'), 'utf8'));
const COUNT = path.join(HERE, '../setup/numbers.json');

// 번호 → 이름 찾아보기 표
const INDEX = {};
for (const p of CFG.카테고리) {
  INDEX[p.no] = { 대분류: p.name, 중분류: null, no: p.no };
  for (const c of p.children) INDEX[c.no] = { 대분류: p.name, 중분류: c.name, no: c.no };
}

// 제목은 본문보다 세 배 무겁게 본다
export function route({ title = '', body = '', tags = [] }) {
  const hay = (s) => String(s).toLowerCase();
  const t = hay(title), b = hay(body), g = hay(tags.join(' '));
  // 제목에 이 말이 있으면 점수와 무관하게 그리로 보낸다
  for (const [no, words] of Object.entries(CFG.강제분류 || {}))
    for (const w of words)
      if (t.includes(hay(w))) return { ...INDEX[no], 확신: 1, 근거: [w], 후보: [] };
  const hits = [];
  for (const [no, words] of Object.entries(CFG.자동분류)) {
    let score = 0;
    const matched = [];
    for (const w of words) {
      const k = hay(w);
      const n = (t.split(k).length - 1) * 3 + (g.split(k).length - 1) * 2 + Math.min(body ? b.split(k).length - 1 : 0, 4);
      if (n > 0) { score += n; matched.push(w); }
    }
    if (score > 0) hits.push({ no, score, matched });
  }
  hits.sort((a, b2) => b2.score - a.score);
  const top = hits[0];
  if (!top) return { ...INDEX['32'], 확신: 0, 근거: [], 후보: [] };   // 못 고르면 생각 조각으로
  const second = hits[1]?.score || 0;
  return {
    ...INDEX[top.no],
    확신: Math.min(1, (top.score - second) / Math.max(top.score, 1)),
    근거: top.matched,
    후보: hits.slice(1, 3).map((h) => ({ ...INDEX[h.no], 점수: h.score })),
  };
}

// 카테고리별 일련번호 — 01-003 같은 모양
export function number(no, { commit = true } = {}) {
  const db = fs.existsSync(COUNT) ? JSON.parse(fs.readFileSync(COUNT, 'utf8')) : {};
  const next = (db[no] || 0) + 1;
  if (commit) { db[no] = next; fs.writeFileSync(COUNT, JSON.stringify(db, null, 2) + '\n'); }
  return `${no}-${String(next).padStart(3, '0')}`;
}

export function assign(post, { commit = true } = {}) {
  const r = route(post);
  return { ...r, 번호: number(r.no, { commit }) };
}

export const 카테고리표 = INDEX;
