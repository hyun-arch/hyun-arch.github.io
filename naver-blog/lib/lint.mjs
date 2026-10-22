// 검사 — 내 기준을 글이 지켰는지 확인한다.
//
// 이 장치는 외부에 아무것도 묻지 않는다. 인터넷도 API도 필요 없다.
// 사람이 매번 까먹는 규칙(제목 길이, 키워드 위치, 이미지 수, 과장 표현…)을
// 기계가 대신 기억하는 자리다.
//
// 검색엔진 두 종류를 같이 본다.
//   네이버  — 제목·첫문단 키워드, 글자 수, 이미지, 체류
//   구글/AI — 질문형 소제목, 바로 답하는 문단, 사실 근거  (GEO·AIO)
import fs from 'node:fs';
import path from 'node:path';
import { load } from './standards.mjs';

const count = (s) => [...String(s || '')].length;
const strip = (md) => String(md || '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/[#*_>`~|-]/g, ' ');

/**
 * @param {object} post { title, body, keyword, images, links, facts }
 * @returns {{ok:boolean, score:number, fail:[], warn:[], pass:[]}}
 */
export function lint(post) {
  const s = load();
  const R = s.글_규칙, NG = s.금지;
  const fail = [], warn = [], pass = [];
  const title = String(post.title || '');
  const body = String(post.body || '');
  const plain = strip(body);
  const kw = String(post.keyword || '').trim();

  const check = (good, label, detail, hard = true) =>
    good ? pass.push(label) : (hard ? fail : warn).push(`${label} — ${detail}`);

  // ── 네이버가 보는 것 ──
  const tl = count(title);
  check(tl >= R.제목_글자수[0] && tl <= R.제목_글자수[1],
        '제목 길이', `${tl}자 (${R.제목_글자수[0]}~${R.제목_글자수[1]}자)`);

  if (kw) {
    check(title.includes(kw), '제목에 키워드', `"${kw}" 가 제목에 없어요`);
    const first = plain.slice(0, 300);
    check(first.includes(kw), '첫 문단에 키워드', '첫 300자 안에 키워드가 없어요');

    const hits = (plain.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const density = hits * count(kw) / Math.max(1, count(plain));
    const [lo, hi] = R.키워드_밀도;
    const pc = (x) => (x * 100).toFixed(1);
    if (density < lo) warn.push(`키워드 밀도 — ${pc(density)}% (권장 ${pc(lo)}~${pc(hi)}%)`);
    else if (density > hi) fail.push(`키워드 과다 — ${pc(density)}% (권장 ${pc(lo)}~${pc(hi)}%) · 남발은 저품질 신호예요`);
    else pass.push('키워드 밀도');
  }

  const len = count(plain);
  check(len >= R.본문_최소글자, '본문 분량', `${len}자 (최소 ${R.본문_최소글자}자)`);
  if (len >= R.본문_최소글자 && (len < R.본문_권장글자[0] || len > R.본문_권장글자[1]))
    warn.push(`분량 — ${len}자 (권장 ${R.본문_권장글자[0]}~${R.본문_권장글자[1]}자)`);

  // 이미지 — 「몇 장 적혀 있나」가 아니라 「파일이 실제로 있나」를 센다.
  // 적혀만 있고 파일이 없으면 발행했을 때 본문에 ![...](...) 글자가 그대로 남는다.
  // (2026-10-20 실측: 5장 통과했는데 실제 파일 0장이었다)
  const refs = [...body.matchAll(/!\[[^\]]*\]\(([^)]*)\)/g)].map((m) => m[1].trim());
  const imgs = post.images?.length ?? refs.length;
  check(imgs >= R.이미지_최소, '이미지 수', `${imgs}장 (최소 ${R.이미지_최소}장)`);

  if (post.dir && refs.length) {
    const missing = refs.filter((r) => {
      if (/^https?:\/\//.test(r)) return false;          // 외부 주소는 확인하지 않는다
      return !fs.existsSync(path.resolve(post.dir, r));
    });
    check(missing.length === 0, '이미지 파일 존재',
          missing.length ? `${missing.length}개 없음 — ${missing.slice(0, 3).join(', ')}` : `${refs.length}개 전부 있음`);
  } else if (refs.length) {
    warn.push('이미지 파일 존재 — 글 폴더를 몰라 확인하지 못했습니다');
  }

  const heads = (body.match(/^#{2,3}\s+.+$/gm) || []);
  check(heads.length >= R.소제목_최소, '소제목 수', `${heads.length}개 (최소 ${R.소제목_최소}개)`);

  // 링크 — 「몇 개 적혀 있나」가 아니라 「발행했을 때 눌리나」를 본다.
  // 이미지와 같은 교훈이다. (2026-10-20 실측: 점검 100점 4편 전부 진짜 링크 0개였다)
  // tonaver.mjs 가 마크다운 링크를 `이름 (주소)` 글자로 바꾸고 있었다 — 글자는 남고 링크는 아니다.
  const linkRefs = [...body.matchAll(/\[([^\]]*)\]\((https?:[^)]+)\)/g)];
  const links = post.links?.length ?? linkRefs.length;
  check(links >= R.링크_최소, '링크', `${links}개 (최소 ${R.링크_최소}개)`);

  // 블로그 홈만 가리키는 링크 — 글을 못 찾아간다
  const 홈만 = linkRefs.filter(([, , url]) => /blog\.naver\.com\/[\w.-]+\/?$/.test(url.trim()));
  if (홈만.length) {
    check(false, '링크가 글을 가리키나',
          `${홈만.length}개가 블로그 홈으로만 갑니다 — ${홈만.slice(0, 2).map(m => m[1]).join(', ')}`);
  } else if (linkRefs.length) {
    check(true, '링크가 글을 가리키나', `${linkRefs.length}개 전부 글 주소`);
  }

  // ── 구글·AI 검색이 보는 것 (GEO·AIO) ──
  const qHeads = heads.filter((h) => /[?？]|무엇|언제|어디|어떻게|왜|얼마|방법|차이/.test(h));
  check(qHeads.length >= R.질문형_소제목_최소, '질문형 소제목',
        `${qHeads.length}개 (최소 ${R.질문형_소제목_최소}개) · AI 검색이 인용하는 모양이에요`, false);

  // 소제목 바로 다음 문단이 짧고 분명하면 AI가 그대로 답으로 인용한다
  let answered = 0;
  for (const h of heads) {
    const at = body.indexOf(h) + h.length;
    const nextPara = strip(body.slice(at, at + 400)).trim().split('\n').find((l) => l.trim());
    if (nextPara && count(nextPara) >= 40 && count(nextPara) <= 220) answered++;
  }
  check(answered >= Math.max(2, Math.floor(heads.length * 0.5)), '소제목 직후 요약',
        `${answered}/${heads.length} — 소제목 바로 밑에 40~220자로 답을 먼저 쓰면 AI가 인용해요`, false);

  // ── 지뢰 ──
  const bad = NG.표현.filter((w) => body.includes(w));
  check(bad.length === 0, '과장 표현 없음', `${bad.join(', ')} — 수치로 바꾸세요`);
  const med = NG.의료표현.filter((w) => body.includes(w));
  check(med.length === 0, '의료 표현 없음', `${med.join(', ')} — 의료기기법 위험`);

  // ── 사실 근거 ──
  // facts.json — 넘겨받지 않았으면 글 폴더에서 직접 읽는다.
  // 이미지·링크와 같은 교훈이다: 「넘겨줬나」가 아니라 「있나」를 본다. (2026-10-22 실측)
  if (!post.facts && post.dir) {
    try { post = { ...post, facts: JSON.parse(fs.readFileSync(path.join(post.dir, 'facts.json'), 'utf8')) }; }
    catch { /* 없으면 아래에서 경고 */ }
  }

  if (post.facts) {
    const unverified = Object.entries(post.facts).filter(([, v]) => !v || v === '확인 필요');
    check(unverified.length === 0, '사실 확인',
          `미확인 ${unverified.length}건: ${unverified.map(([k]) => k).join(', ')}`);
  } else {
    warn.push('사실 파일 — facts.json 이 없어요. 지어낸 숫자가 섞일 수 있어요');
  }

  const total = pass.length + fail.length + warn.length;
  return {
    ok: fail.length === 0,
    score: total ? Math.round((pass.length + warn.length * 0.5) / total * 100) : 0,
    fail, warn, pass,
  };
}

export function report(r) {
  const L = [];
  L.push(`  ${r.ok ? '발행 가능' : '고칠 것 있음'} · ${r.score}점`);
  if (r.fail.length) { L.push(''); r.fail.forEach((f) => L.push('  ✗ ' + f)); }
  if (r.warn.length) { L.push(''); r.warn.forEach((w) => L.push('  △ ' + w)); }
  if (r.pass.length) { L.push(''); L.push('  ✓ ' + r.pass.join(' · ')); }
  return L.join('\n');
}
