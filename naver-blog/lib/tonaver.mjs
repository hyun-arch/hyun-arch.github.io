// 마크다운 → 네이버 스마트에디터.
//
// 왜 필요한가: 에디터는 마크다운을 모른다. 글을 그대로 치면 ## 과 ** 가 글자로 남고,
// ![](...) 는 이미지가 아니라 문자열이 된다. (2026-10-20 임시저장에서 실측)
// 그래서 여기서 기호를 걷어 내고, 이미지는 「그 자리」블록으로 뽑아낸다.
import fs from 'node:fs';
import path from 'node:path';

const IMG = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/;

/** 인라인 서식을 네이버가 읽을 수 있는 평문으로 */
export function inline(t, 링크모음 = []) {
  return String(t)
    // 링크 — 이름만 문장에 남기고 주소는 문단 끝으로 뺀다.
    // 네이버는 「줄에 주소만 홀로」 있을 때 자동으로 링크를 건다.
    // 전에는 `이름 (주소)` 로 바꿨는데 글자로만 남고 눌리지 않았다 —
    // 발행된 글 4편을 열어 보니 진짜 링크가 0개였다. (2026-10-20 실측)
    // 문장 중간에서 줄을 끊으면 글이 깨지니, 주소는 모아서 뒤에 붙인다.
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_m, name, url) => {
      링크모음.push(url);
      return name;
    })
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1');
}

/**
 * @param {string} md  post.md 본문 (제목 줄 제외)
 * @param {string} dir 글 폴더 — 이미지 상대경로를 푸는 기준
 * @returns {{blocks:Array, text:string, images:string[], missing:string[]}}
 */
export function toNaver(md, dir) {
  const blocks = [];
  const images = [], missing = [];
  let buf = [];
  const 링크모음 = [];     // 문단마다 비운다 — flush() 에서 뒤에 붙이고 치운다
  let 표머리 = [];         // 마크다운 표의 머리글. 표가 끝나면 비운다

  const flush = () => {
    let t = buf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    // 이 문단에서 뽑아낸 주소를 뒤에 한 줄씩 붙인다 — 네이버가 자동으로 링크를 건다
    if (t && 링크모음.length) t += '\n' + [...new Set(링크모음)].join('\n');
    링크모음.length = 0;
    if (t) blocks.push({ type: 'text', text: t });
    buf = [];
  };

  for (const raw of String(md).split('\n')) {
    const line = raw.replace(/\s+$/, '');

    const m = line.match(IMG);
    if (m) {
      const rel = m[2].trim();
      const abs = /^https?:\/\//.test(rel) ? rel : path.resolve(dir || '.', rel);
      if (/^https?:\/\//.test(rel)) { missing.push(rel); continue; }  // 외부 주소는 못 올린다
      if (!fs.existsSync(abs)) { missing.push(rel); continue; }
      flush();
      blocks.push({ type: 'image', path: abs, alt: m[1] });
      images.push(abs);
      continue;
    }

    // 마크다운 표 — 에디터는 모른다. 글자로 그대로 들어가면 「| --- | --- |」가 보인다.
    // 줄글로 풀어 쓴다. 표가 필요하면 도표 이미지로 만드는 게 낫다. (2026-10-22 실측)
    if (/^\s*\|.*\|\s*$/.test(line)) {
      // 셀도 inline() 을 거쳐야 한다 — 안 거치면 ** 가 글자로 남는다. (2026-10-22 실측)
      const cells = line.split('|').slice(1, -1).map((c) => inline(c.trim(), 링크모음));
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;        // 구분줄은 버린다
      if (표머리.length === 0) { 표머리 = cells; continue; }           // 첫 줄은 머리글 (이미 inline 거침)
      // 첫 칸은 그 줄의 제목으로 쓴다 (머리글이 비어 있는 흔한 표 모양)
      const 제목 = cells[0] || '';
      const parts = cells.slice(1).map((c, i) => {
        const h = 표머리[i + 1] || '';
        return h && c ? `${h} ${c}` : (c || '');
      }).filter(Boolean);
      if (제목 || parts.length)
        buf.push('· ' + [제목, parts.join(' / ')].filter(Boolean).join(' — '));
      continue;
    }
    if (표머리.length && !/^\s*\|/.test(line)) 표머리 = [];          // 표가 끝났다

    if (/^---+\s*$/.test(line)) { flush(); continue; }               // 구분선은 버린다
    const h = line.match(/^(#{2,4})\s+(.+)$/);
    if (h) { flush(); blocks.push({ type: 'text', text: inline(h[2], 링크모음) }); continue; }
    if (/^#\s+/.test(line)) continue;                                 // 제목은 제목칸에 따로 들어간다

    buf.push(inline(line.replace(/^>\s?/, '').replace(/^[-*]\s+/, '· '), 링크모음));
  }
  flush();

  return {
    blocks,
    text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n\n'),
    images, missing,
  };
}
