// AI 작가 — 초고를 쓴다.
//
// 중요한 선택: 외부 유료 API 를 쓰지 않는다. 이미 구독 중인 Claude Code 를 그대로 부른다.
//   claude -p "<지시문>"
// 매일 API 에 돈을 내지 않아도 되고, 키를 따로 관리할 필요도 없다.
//
// 강의의 원칙 그대로 — 판단이 필요한 자리(문장 쓰기)만 AI 가 하고,
// 구조·규칙·검사는 전부 프로그램이 한다. 그래서 결과가 매번 흔들리지 않는다.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './standards.mjs';

const run = promisify(execFile);

function claudeBin() {
  for (const p of [process.env.HOME + '/.local/bin/claude', '/opt/homebrew/bin/claude', '/usr/local/bin/claude']) {
    if (fs.existsSync(p)) return p;
  }
  return 'claude';
}

/** 글의 뼈대 — 네이버와 AI 검색 둘 다 잡는 모양 */
export function outline({ keyword, intent = '정보', facts = {} }) {
  const q = [
    `${keyword}은(는) 얼마나 할까요`,
    `무엇이 다를까요`,
    `어떻게 고르면 될까요`,
    `어디서 확인할 수 있나요`,
  ];
  return {
    제목규칙: '키워드를 앞쪽에 두고, 괄호로 연도나 조건을 덧붙여 25~40자',
    첫문단: '키워드를 자연스럽게 넣고, 이 글이 무엇을 알려주는지 두 문장으로',
    소제목: q,
    각소제목아래: '40~220자로 답을 먼저 쓴다. AI 검색이 이 문단을 그대로 인용한다',
    사실: facts,
    마무리: '요약 + 다음 행동 하나',
  };
}

const RULES = (s, kw) => [
  '너는 네이버 블로그 글을 쓴다. 아래 규칙을 지켜라.',
  '',
  `1) 핵심 키워드는 "${kw}" 이다. 제목 앞쪽과 첫 문단에 자연스럽게 넣어라.`,
  `2) 제목은 ${s.글_규칙.제목_글자수[0]}~${s.글_규칙.제목_글자수[1]}자.`,
  `3) 본문은 ${s.글_규칙.본문_권장글자[0]}~${s.글_규칙.본문_권장글자[1]}자.`,
  `4) ## 소제목을 ${s.글_규칙.소제목_최소}개 이상 쓰고, 그중 ${s.글_규칙.질문형_소제목_최소}개 이상은 질문형으로.`,
  '5) 각 소제목 바로 아래 첫 문단은 40~220자로 질문에 바로 답하라. 뜸 들이지 마라.',
  `6) 이미지 자리를 ${s.글_규칙.이미지_최소}곳 이상 ![설명](사진파일명) 으로 표시하라.`,
  `7) 키워드를 ${(s.글_규칙.키워드_밀도[0]*100).toFixed(1)}~${(s.글_규칙.키워드_밀도[1]*100).toFixed(1)}% 안에서만 써라. 남발하면 저품질로 걸린다.`,
  '',
  `금지: ${s.금지.표현.join(', ')} — 과장 대신 숫자를 써라.`,
  `절대 금지: ${s.금지.의료표현.join(', ')} — 의료기기법 위반이 된다.`,
  '',
  '주어진 "사실"에 없는 숫자나 사양은 절대 지어내지 마라. 모르면 그 부분을 쓰지 마라.',
  '출력은 마크다운 본문만. 설명이나 머리말을 붙이지 마라. 첫 줄은 "# 제목" 으로 시작하라.',
].join('\n');

/**
 * 초고를 쓴다.
 * @param {object} p { keyword, facts, angle, links }
 */
export async function draft({ keyword, facts = {}, angle = '', links = [] }) {
  const s = load();
  const prompt = [
    RULES(s, keyword),
    '',
    '── 사실 (이 안에서만 써라) ──',
    Object.entries(facts).map(([k, v]) => `${k}: ${v}`).join('\n') || '(없음)',
    links.length ? '\n── 넣을 링크 ──\n' + links.map((l) => `${l.label}: ${l.url}`).join('\n') : '',
    angle ? `\n── 글의 각도 ──\n${angle}` : '',
    '',
    `이제 "${keyword}" 로 네이버 블로그 글을 써라.`,
  ].join('\n');

  const { stdout } = await run(claudeBin(), ['-p', prompt], {
    maxBuffer: 1024 * 1024 * 8,
    cwd: process.env.TMPDIR || '/tmp',
  });
  const body = stdout.trim();
  const title = (body.match(/^#\s+(.+)$/m) || [, ''])[1].trim();
  return { title, body: body.replace(/^#\s+.+\n+/, ''), raw: body, keyword, facts, links };
}

/** 검사에서 걸린 것을 고쳐 다시 쓴다 */
export async function revise(post, lintResult) {
  const s = load();
  const prompt = [
    RULES(s, post.keyword),
    '',
    '아래 글이 검사에서 걸렸다. 걸린 것만 고쳐서 전체를 다시 출력하라.',
    '',
    '── 걸린 것 ──',
    ...lintResult.fail.map((f) => '· ' + f),
    ...lintResult.warn.map((w) => '· (권고) ' + w),
    '',
    '── 사실 ──',
    Object.entries(post.facts || {}).map(([k, v]) => `${k}: ${v}`).join('\n') || '(없음)',
    '',
    '── 원래 글 ──',
    '# ' + post.title,
    post.body,
  ].join('\n');

  const { stdout } = await run(claudeBin(), ['-p', prompt], {
    maxBuffer: 1024 * 1024 * 8,
    cwd: process.env.TMPDIR || '/tmp',
  });
  const body = stdout.trim();
  const title = (body.match(/^#\s+(.+)$/m) || [, post.title])[1].trim();
  return { ...post, title, body: body.replace(/^#\s+.+\n+/, ''), raw: body };
}
