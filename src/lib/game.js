// ─────────────────────────────────────────────────────────────
// 아라미 성장 엔진 (game)
//
// 지금까지의 레벨/XP는 "페이지를 몇 번 열었나"였다. 그건 장식이다.
// 여기서는 XP가 오직 행동에서 나온다 — 던지고, 올리고, 근거를 붙이고, 결정하고, 끝낸 것.
//
// 그리고 업적 18개는 전부 스폰지클럽 크루의 이름을 땄다.
// 배지를 딴다는 건 그 사람의 코어를 몸으로 한 번 통과했다는 뜻이다.
// 147명을 읽는 게 아니라, 쓰면서 한 명씩 획득한다. 이게 이 앱의 압축 방식이다.
//
// 저장 : aramirror.game.v1 (상호작용 카운터만. XP·레벨·배지는 os-core 상태에서 매번 계산)
// ─────────────────────────────────────────────────────────────

import * as OS from './os-core.js';

const KEY = 'aramirror.game.v1';
const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

/* ══════════ 레벨 — 10단계, 씨앗에서 거울까지 ══════════ */
export const LEVELS = [
  { lv: 1,  at: 0,    ko: '씨앗',   en: 'Seed',   ic: '🌱', say: '던지기 시작했어요. 그게 전부의 시작이에요.' },
  { lv: 2,  at: 30,   ko: '새싹',   en: 'Sprout', ic: '🌿', say: '싹이 났어요. 이제 매일이 중요해요.' },
  { lv: 3,  at: 80,   ko: '줄기',   en: 'Stem',   ic: '🎋', say: '줄기가 섰어요. 던진 게 어디로 갈지 알기 시작했어요.' },
  { lv: 4,  at: 160,  ko: '잎',     en: 'Leaf',   ic: '🍃', say: '잎이 폈어요. 정리가 습관이 되고 있어요.' },
  { lv: 5,  at: 280,  ko: '가지',   en: 'Branch', ic: '🌳', say: '가지가 뻗었어요. 생각끼리 엮이기 시작했어요.' },
  { lv: 6,  at: 450,  ko: '꽃',     en: 'Bloom',  ic: '🌸', say: '꽃이 폈어요. 남에게 보여줄 수 있는 게 생겼어요.' },
  { lv: 7,  at: 700,  ko: '열매',   en: 'Fruit',  ic: '🍎', say: '열매가 열렸어요. 생각이 자산이 됐어요.' },
  { lv: 8,  at: 1050, ko: '나무',   en: 'Tree',   ic: '🌲', say: '나무가 됐어요. 이제 시스템이 스스로 돌아요.' },
  { lv: 9,  at: 1500, ko: '숲',     en: 'Grove',  ic: '🏞', say: '숲이 됐어요. 남도 여기서 쉴 수 있어요.' },
  { lv: 10, at: 2100, ko: '거울',   en: 'Mirror', ic: '🪞', say: 'AI가 당신을 비추기 시작했어요. 이게 아라미러의 끝이자 시작이에요.' },
];

/* ══════════ XP — 오직 행동에서만 ══════════ */
export const XP_RULES = [
  { k: 'capture',  v: 2,  ko: '한 줄 던지기',        gene: 'friction' },
  { k: 'sorted',   v: 3,  ko: '정리됨으로 승격',      gene: 'promote' },
  { k: 'wiki',     v: 5,  ko: '지식으로 승격',        gene: 'promote' },
  { k: 'asset',    v: 10, ko: '자산으로 승격',        gene: 'promote' },
  { k: 'verified', v: 3,  ko: '근거 확인',            gene: 'evidence' },
  { k: 'done',     v: 4,  ko: '할 일 완료',           gene: 'loop' },
  { k: 'decision', v: 8,  ko: '결정 카드 남기기',      gene: 'socratic' },
  { k: 'streak',   v: 5,  ko: '연속 하루당 보너스',    gene: 'loop' },
];

/* ══════════ 업적 18 — 전부 크루 이름을 땄다 ══════════ */
// need(s) : 현재 상태 s 를 받아 [달성수, 목표수] 를 돌려준다.
export const BADGES = [
  { id: 'ttink',   ic: '🚪', ko: '띵크의 문',      who: '띵크(이예성)', gene: 'friction',
    why: '"진짜 마찰은 매번 로그인해서 들어가는 것 자체였다"',
    how: '아무 화면에서나 10번 던지기', need: (s) => [s.total, 10] },
  { id: 'kwak',    ic: '⚡', ko: '곽동욱의 순간',   who: '곽동욱', gene: 'friction',
    why: '"읽다 막힌 것을 즉시 던진다"',
    how: '하루에 5개 던지기', need: (s) => [s.today, 5] },
  { id: 'hmin',    ic: '🪜', ko: '흐민의 계단',    who: '흐민(김현민)', gene: 'promote',
    why: '사고 → 지식 → 자산 3레이어를 처음 설계한 사람',
    how: '처음으로 자산 단계까지 올리기', need: (s) => [s.assets ? 1 : 0, 1] },
  { id: 'dylan',   ic: '🚪', ko: '딜런의 출구',    who: '딜런(조종훈)', gene: 'promote',
    why: '"세컨브레인의 어려운 부분은 수집이 아니라 출구다"',
    how: '자산 5개 만들기', need: (s) => [s.assets, 5] },
  { id: 'hani',    ic: '🔥', ko: '하니의 연속',    who: '하니(우동한)', gene: 'promote',
    why: '2024년부터 하루도 안 거르고 기록한 사람',
    how: '7일 연속 던지기', need: (s) => [s.streak, 7] },
  { id: 'geowi',   ic: '📆', ko: '거위의꿈의 반년', who: '거위의꿈(임정선)', gene: 'promote',
    why: '"6개월 쌓이면 제품 라이브러리 = CMS가 된다"',
    how: '30일 연속 던지기', need: (s) => [s.streak, 30] },
  { id: 'modak',   ic: '👁', ko: '모닥의 눈',      who: '모닥(김은영)', gene: 'evidence',
    why: '"AI의 가장 큰 위험은 그럴듯한 추측"',
    how: '미확인 자료 5건에 근거 붙이기', need: (s) => [s.verifiedCount, 5] },
  { id: 'aewol',   ic: '📊', ko: '애월의 커버리지', who: '애월(이연정)', gene: 'evidence',
    why: '"확인할 수 없는 근거는 근거가 아니다"',
    how: '근거 확인 20건', need: (s) => [s.verifiedCount, 20] },
  { id: 'leuni',   ic: '⚖️', ko: '르니의 카드',    who: '르니(유자애)', gene: 'socratic',
    why: '"대신 결정해주지 않고 스스로 결론에 닿게 한다"',
    how: '결정 카드 1장 남기기', need: (s) => [s.decisions, 1] },
  { id: 'kong',    ic: '🚧', ko: '콩의 허들',      who: '콩(공지은)', gene: 'socratic',
    why: '"믿기 전, 한 번의 허들을"',
    how: '네 칸을 모두 채운 결정 카드 5장', need: (s) => [s.fullDecisions, 5] },
  { id: 'jack',    ic: '🔁', ko: '잭의 재호출',    who: '잭(유재현)', gene: 'loop',
    why: '"봇이 한 번만 오는 게 아니라 반응이 없으면 다시 온다"',
    how: '시스템이 건 말에 3번 응답하기', need: (s) => [s.nudgeHandled, 3] },
  { id: 'dani',    ic: '🌅', ko: '다니의 아침',    who: '다니(송다은)', gene: 'loop',
    why: '"자동화보다 데이터 누적이 더 큰 자산"',
    how: '오늘의 미션 3개를 3일 동안 완주', need: (s) => [s.missionDays, 3] },
  { id: 'utneun',  ic: '🪞', ko: '웃는돌의 정직',  who: '웃는돌(장경아)', gene: 'honest',
    why: '"만들어서 배포까지 했는데 정작 내가 안 쓰게 됐다"',
    how: '정직 로그를 열어 내가 안 쓰는 곳 확인하기', need: (s) => [s.honestOpened ? 1 : 0, 1] },
  { id: 'mark',    ic: '🗑', ko: '마크의 폐기',    who: '마크(전준하)', gene: 'honest',
    why: '공들인 워크플로우를 실사용 0이라 스스로 폐기한 사람',
    how: '안 쓰는 항목 5개 지우기', need: (s) => [s.deleted, 5] },
  { id: 'pobi',    ic: '📐', ko: '포비의 틀',      who: '포비(이지선)', gene: 'format',
    why: '"OS는 결국 고정(틀)과 변수(내용)를 갈라내는 일"',
    how: '같은 태그를 10번 쓰기', need: (s) => [s.topTag, 10] },
  { id: 'segye',   ic: '🎼', ko: '세계로의 분류',  who: '세계로(진혜정)', gene: 'orchest',
    why: '"기록의 병목은 저장이 아니라 분류다"',
    how: '여섯 종류(생각·할일·일정·자료·질문·결정)를 하나씩 다 만들기', need: (s) => [s.kindsUsed, 6] },
  { id: 'choi',    ic: '📏', ko: '최강훈의 실측',  who: '최강훈', gene: 'honest',
    why: '"추정하지 말고 측정할 것"',
    how: '승격률 50% 넘기기 (자산·지식이 절반 이상)', need: (s) => [Math.min(s.promoteRate, 50), 50] },
  { id: 'mirror',  ic: '🧬', ko: '147의 거울',     who: '스폰지클럽 1·2기 전원', gene: 'promote',
    why: '147명의 코어를 전부 통과한 사람에게',
    how: '레벨 10 · 거울 도달', need: (s) => [s.level, 10] },
];

/* ══════════ 오늘의 미션 풀 ══════════ */
const MISSION_POOL = [
  { id: 'm-cap',   ic: '⚡', ko: '한 줄 던지기',              hint: 'C 키를 눌러 아무거나', done: (s) => s.today >= 1 },
  { id: 'm-cap3',  ic: '⚡', ko: '세 줄 던지기',              hint: '떠오르는 대로 세 개', done: (s) => s.today >= 3 },
  { id: 'm-up',    ic: '⬆', ko: '하나 승격시키기',            hint: '인박스에서 [승격 →]', done: (s) => s.upsToday >= 1 },
  { id: 'm-up2',   ic: '⬆', ko: '두 칸 올리기',              hint: '같은 걸 두 번 올려도 돼요', done: (s) => s.upsToday >= 2 },
  { id: 'm-ver',   ic: '🔍', ko: '근거 하나 확인하기',        hint: '미확인 자료를 눌러 상태 바꾸기', done: (s) => s.verifiedCount >= 1 },
  { id: 'm-done',  ic: '✅', ko: '할 일 하나 끝내기',          hint: '작은 것부터', done: (s) => s.doneCount >= 1 },
  { id: 'm-dec',   ic: '⚖️', ko: '결정 카드 한 장',           hint: '결정·기준·리스크·첫걸음', done: (s) => s.decisions >= 1 },
  { id: 'm-tag',   ic: '#',  ko: '태그 붙여서 던지기',        hint: '#경영 처럼 앞에 # 을', done: (s) => s.tagged >= 1 },
  { id: 'm-asset', ic: '💎', ko: '자산 하나 만들기',          hint: '끝까지 네 칸 올리기', done: (s) => s.assets >= 1 },
  { id: 'm-clean', ic: '🗑', ko: '안 쓸 것 하나 지우기',      hint: '버리는 것도 정리예요', done: (s) => s.deleted >= 1 },
];

/* ══════════ 저장 (상호작용 카운터) ══════════ */
function load() {
  if (!isBrowser) return { seen: [], nudgeHandled: 0, honestOpened: false, missionDays: [], deleted: 0, ups: [] };
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? JSON.parse(raw) : {};
    return {
      seen: d.seen || [], nudgeHandled: d.nudgeHandled || 0, honestOpened: !!d.honestOpened,
      missionDays: d.missionDays || [], deleted: d.deleted || 0, ups: d.ups || [],
    };
  } catch { return { seen: [], nudgeHandled: 0, honestOpened: false, missionDays: [], deleted: 0, ups: [] }; }
}
function put(d) {
  if (!isBrowser) return;
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}
export function bump(kind, n = 1) {
  const d = load();
  if (kind === 'nudge') d.nudgeHandled += n;
  else if (kind === 'honest') d.honestOpened = true;
  else if (kind === 'deleted') d.deleted += n;
  else if (kind === 'up') d.ups.push(Date.now());
  put(d);
}

/* ══════════ 상태 계산 — 모든 지표는 실제 데이터에서 ══════════ */
export function snapshot() {
  const g = load();
  const items = OS.getItems();
  const decs = OS.getDecisions();
  const os = OS.stats();
  const today = OS.todayStr();

  // 태그 최다 사용 횟수
  const tagN = {};
  items.forEach((i) => (i.tags || []).forEach((t) => { tagN[t] = (tagN[t] || 0) + 1; }));
  const topTag = Object.values(tagN).reduce((a, b) => Math.max(a, b), 0);

  // XP — 행동에서만 나온다
  let xp = 0;
  xp += items.length * 2;                                     // 던지기
  items.forEach((i) => (i.ups || []).forEach((u) => {
    xp += u.to === 'sorted' ? 3 : u.to === 'wiki' ? 5 : u.to === 'asset' ? 10 : 0;
  }));
  const verifiedCount = items.filter((i) => i.verified !== 'unknown' && i.src).length
                      + items.filter((i) => i.verified === 'inferred' && !i.src).length;
  xp += verifiedCount * 3;
  const doneCount = items.filter((i) => i.kind === 'todo' && i.done).length;
  xp += doneCount * 4;
  xp += decs.length * 8;
  xp += os.streak * 5;

  const level = LEVELS.reduce((acc, L) => (xp >= L.at ? L : acc), LEVELS[0]);
  const next = LEVELS[Math.min(LEVELS.length - 1, level.lv)];
  const isMax = level.lv >= LEVELS.length;
  const frac = isMax ? 1 : Math.max(0, Math.min(1, (xp - level.at) / (next.at - level.at)));

  const upsToday = (g.ups || []).filter((t) => OS.todayStr(new Date(t)) === today).length;

  return {
    xp, level: level.lv, levelInfo: level, next, frac, isMax,
    total: items.length, today: os.today, streak: os.streak,
    assets: os.byStage.asset || 0,
    inbox: os.byStage.inbox || 0, sorted: os.byStage.sorted || 0, wiki: os.byStage.wiki || 0,
    promoteRate: os.promoteRate,
    decisions: decs.length,
    fullDecisions: decs.filter((d) => d.decision && d.criteria && d.risk && d.firstStep).length,
    verifiedCount, doneCount,
    tagged: items.filter((i) => (i.tags || []).length).length,
    topTag,
    kindsUsed: new Set(items.map((i) => i.kind)).size,
    unverified: os.unverified, openTodo: os.openTodo,
    nudgeHandled: g.nudgeHandled, honestOpened: g.honestOpened, deleted: g.deleted,
    missionDays: (g.missionDays || []).length,
    upsToday,
    seen: g.seen,
  };
}

/* ══════════ 업적 진행/획득 ══════════ */
export function badgeState() {
  const s = snapshot();
  return BADGES.map((b) => {
    const [cur, goal] = b.need(s);
    const got = cur >= goal;
    return { ...b, cur: Math.min(cur, goal), goal, got, pct: Math.min(100, Math.round((cur / goal) * 100)) };
  });
}
/** 새로 딴 배지를 돌려주고, 본 것으로 기록한다 (축하 애니메이션용) */
export function claimNew() {
  const g = load();
  const fresh = badgeState().filter((b) => b.got && !g.seen.includes(b.id));
  if (fresh.length) { g.seen = g.seen.concat(fresh.map((b) => b.id)); put(g); }
  return fresh;
}

/* ══════════ 오늘의 미션 — 날짜 시드로 매일 3개 ══════════ */
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick(arr, n, seed) {
  const a = arr.slice(); const out = []; let s = seed;
  for (let i = 0; i < n && a.length; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    out.push(a.splice(s % a.length, 1)[0]);
  }
  return out;
}
export function todayMissions() {
  const s = snapshot();
  const day = OS.todayStr();
  const ms = pick(MISSION_POOL, 3, seedOf(day)).map((m) => ({ ...m, done: m.done(s) }));
  const allDone = ms.every((m) => m.done);
  // 3개 다 끝낸 날을 기록 (다니의 아침 배지)
  if (allDone && isBrowser) {
    const g = load();
    if (!g.missionDays.includes(day)) { g.missionDays.push(day); put(g); }
  }
  return { day, missions: ms, allDone, cleared: ms.filter((m) => m.done).length };
}

/* ══════════ 오늘의 유전자 — 147명이 하루 한 명씩 말을 건다 ══════════ */
export function todayCrew(people) {
  const list = people.filter((p) => p.gene !== 'empty' && p.core && p.quote);
  if (!list.length) return null;
  const day = OS.todayStr();
  return { ...list[seedOf(day + 'crew') % list.length], day };
}

/* ══════════ 다음 한 칸 — 지금 무엇을 하면 가장 이득인가 ══════════ */
export function nextBest() {
  const s = snapshot();
  if (s.total === 0) return { ic: '⚡', t: '아무거나 한 줄 던져보세요', d: '이 시스템의 입구는 그거 하나예요.', to: '#capture', xp: 2 };
  if (s.inbox >= 5) return { ic: '⬆', t: `인박스 ${s.inbox}건을 한 칸씩 올려요`, d: '쌓기만 하면 자산이 안 돼요.', to: '/inbox', xp: 3 };
  if (s.unverified >= 3) return { ic: '🔍', t: `미확인 자료 ${s.unverified}건에 근거를 붙여요`, d: '확인 안 된 건 근거가 아니에요.', to: '/inbox?f=unknown', xp: 3 };
  if (s.openTodo >= 1) return { ic: '✅', t: `안 끝난 할 일 ${s.openTodo}건`, d: '작은 것부터 하나만.', to: '/inbox?f=todo', xp: 4 };
  if (s.decisions === 0) return { ic: '⚖️', t: '결정 카드를 한 장 남겨요', d: '결정·기준·리스크·첫걸음 네 칸이면 끝.', to: '/inbox#decision', xp: 8 };
  if (!s.assets) return { ic: '💎', t: '하나를 자산까지 올려봐요', d: '끝까지 올라간 게 하나는 있어야 해요.', to: '/inbox', xp: 10 };
  return { ic: '🌱', t: '오늘도 한 줄 던져요', d: '연속이 끊기지 않는 게 제일 큰 자산이에요.', to: '#capture', xp: 2 };
}
