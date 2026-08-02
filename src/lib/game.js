// ─────────────────────────────────────────────────────────────
// 아라미 성장 엔진 (game)
//
// XP는 오직 행동에서 나온다. 페이지를 몇 번 열었나가 아니라
// 던지고, 올리고, 근거를 붙이고, 결정하고, 끝낸 것에서만 오른다.
//
// 업적은 "무엇을 해냈나"의 이름이다. 자랑이 아니라 다음에 뭘 하면 되는지를 알려주는 지도다.
//
// 저장 : aramirror.game.v1 (상호작용 카운터만. XP·레벨·업적은 os-core 상태에서 매번 계산)
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
  { k: 'capture',  v: 2,  ko: '한 줄 던지기' },
  { k: 'sorted',   v: 3,  ko: '정리됨으로 승격' },
  { k: 'wiki',     v: 5,  ko: '지식으로 승격' },
  { k: 'asset',    v: 10, ko: '자산으로 승격' },
  { k: 'verified', v: 3,  ko: '근거 확인' },
  { k: 'done',     v: 4,  ko: '할 일 완료' },
  { k: 'decision', v: 8,  ko: '결정 카드 남기기' },
  { k: 'streak',   v: 5,  ko: '연속 하루당 보너스' },
];

/* ══════════ 업적 18 — 내가 해낸 것의 이름 ══════════ */
// need(s) : 현재 상태 s 를 받아 [달성수, 목표수] 를 돌려준다.
export const BADGES = [
  { id: 'firstdoor', ic: '🚪', ko: '첫 문',        axis: 'friction',
    why: '입구가 하나면 습관이 된다.',            how: '아무 화면에서나 10번 던지기', need: (s) => [s.total, 10] },
  { id: 'moment',    ic: '⚡', ko: '그 순간',      axis: 'friction',
    why: '막힌 그 자리에서 바로 던지는 게 핵심이다.', how: '하루에 5개 던지기', need: (s) => [s.today, 5] },
  { id: 'firststep', ic: '🪜', ko: '첫 계단',      axis: 'promote',
    why: '한 칸이라도 올라가야 쌓기가 자산이 된다.', how: '처음으로 자산 단계까지 올리기', need: (s) => [s.assets ? 1 : 0, 1] },
  { id: 'exit',      ic: '🚪', ko: '출구',          axis: 'promote',
    why: '어려운 건 모으기가 아니라 꺼내 쓰기다.',  how: '자산 5개 만들기', need: (s) => [s.assets, 5] },
  { id: 'week',      ic: '🔥', ko: '일주일',        axis: 'promote',
    why: '끊기지 않는 것 자체가 가장 큰 자산이다.', how: '7일 연속 던지기', need: (s) => [s.streak, 7] },
  { id: 'month',     ic: '📆', ko: '한 달',         axis: 'promote',
    why: '한 달 쌓이면 그때부터 데이터가 말을 한다.', how: '30일 연속 던지기', need: (s) => [s.streak, 30] },
  { id: 'doubt',     ic: '👁', ko: '의심하는 눈',   axis: 'evidence',
    why: '그럴듯한 추측이 가장 비싼 버그다.',       how: '미확인 자료 5건에 근거 붙이기', need: (s) => [s.verifiedCount, 5] },
  { id: 'weight',    ic: '📊', ko: '근거의 무게',   axis: 'evidence',
    why: '확인할 수 없는 근거는 근거가 아니다.',    how: '근거 확인 20건', need: (s) => [s.verifiedCount, 20] },
  { id: 'firstcall', ic: '⚖️', ko: '첫 결정',       axis: 'socratic',
    why: '머릿속 고민은 카드가 되기 전엔 안 끝난다.', how: '결정 카드 1장 남기기', need: (s) => [s.decisions, 1] },
  { id: 'fourbox',   ic: '🚧', ko: '네 칸을 다 채움', axis: 'socratic',
    why: '결정·기준·리스크·첫걸음이 다 있어야 다시 꺼내 쓴다.', how: '네 칸 모두 채운 결정 카드 5장', need: (s) => [s.fullDecisions, 5] },
  { id: 'recall',    ic: '🔁', ko: '다시 온 알림',  axis: 'loop',
    why: '무시하면 다시 온다. 그래서 안 놓친다.',   how: '시스템이 건 말에 3번 응답하기', need: (s) => [s.nudgeHandled, 3] },
  { id: 'threedawn', ic: '🌅', ko: '사흘의 아침',   axis: 'loop',
    why: '사흘이면 리듬이고, 리듬이면 시스템이다.', how: '오늘의 미션 3개를 3일 완주', need: (s) => [s.missionDays, 3] },
  { id: 'mirror0',   ic: '🪞', ko: '거울을 봄',     axis: 'honest',
    why: '안 쓰는 걸 아는 게 더 만드는 것보다 어렵다.', how: '정직 로그를 열어 안 쓰는 곳 확인하기', need: (s) => [s.honestOpened ? 1 : 0, 1] },
  { id: 'letgo',     ic: '🗑', ko: '버리는 용기',   axis: 'honest',
    why: '버리는 것도 정리다. 애착이 제일 비싸다.', how: '안 쓰는 항목 5개 지우기', need: (s) => [s.deleted, 5] },
  { id: 'sameform',  ic: '📐', ko: '같은 틀',       axis: 'format',
    why: '고정과 변수를 가르면 늘어나도 안 무겁다.', how: '같은 태그를 10번 쓰기', need: (s) => [s.topTag, 10] },
  { id: 'sixways',   ic: '🎼', ko: '여섯 갈래',     axis: 'orchest',
    why: '분류가 되면 찾는 시간이 사라진다.',       how: '여섯 종류를 하나씩 다 만들기', need: (s) => [s.kindsUsed, 6] },
  { id: 'halfway',   ic: '📏', ko: '절반을 넘김',   axis: 'honest',
    why: '추정하지 말고 측정할 것.',                how: '승격률 50% 넘기기', need: (s) => [Math.min(s.promoteRate, 50), 50] },
  { id: 'themirror', ic: '🧬', ko: '거울',          axis: 'promote',
    why: 'AI가 나를 비추기 시작하는 지점.',         how: '레벨 10 · 거울 도달', need: (s) => [s.level, 10] },
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
