// ─────────────────────────────────────────────────────────────
// 아람미러 OS 커널 (os-core)
//
// 아람미러 전체가 공유하는 단 하나의 저장소·데이터 모델.
// 스폰지클럽 1·2기 147명의 과제에서 뽑은 유전자를 "글"이 아니라 "동작"으로 박아넣은 곳.
//
//  ⚡ friction  던지는 순간과 저장되는 순간의 거리를 0으로       (띵크·린디·곽동욱·달빛그린)
//  🎼 orchest   저장의 병목은 저장이 아니라 분류 → 라우터가 대신  (세계로·치코·지니)
//  ⬆ promote   기록이 아니라 승격 — 인박스→정리→위키→자산       (흐민·딜런·레미·잭·하니)
//  🔍 evidence  확인 안 된 건 확인 안 됐다고 데이터에 박아둔다     (모닥·애월·지수·박미수)
//  ❓ socratic  결정은 카드로 남고 다시 꺼내 쓸 수 있어야 한다     (르니·위버·설록·콩)
//  🔁 loop      내가 열어야 도는 시스템은 안 돈다 → 먼저 말 건다   (다니·골프청년·잭·쎄이)
//  🪞 honest    안 쓰는 기능은 드러나야 한다 → 사용 로그          (웃는돌·마크·최강훈)
//  🔒 boundary  데이터는 이 브라우저에만 산다. 서버로 안 나간다    (Galia·챈·개미·써니)
//
// 저장 위치 : localStorage 단일 키. 서버 전송 없음.
// ─────────────────────────────────────────────────────────────

const KEY = 'aramirror.os.v1';
const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

/* ── 모델 상수 ───────────────────────────────────────────── */

// 승격 4단계 — 기록이 아니라 승격이 핵심 (흐민 · 아람)
export const STAGES = [
  { id: 'inbox',  ko: '인박스', ic: '📥', desc: '던져진 그대로. 아직 아무 판단도 안 했다.' },
  { id: 'sorted', ko: '정리됨', ic: '🗂', desc: '무엇인지 정해졌다. 종류·태그·기한이 붙었다.' },
  { id: 'wiki',   ko: '지식',   ic: '🧠', desc: '다른 것과 엮였다. 다시 꺼내 쓸 수 있는 상태.' },
  { id: 'asset',  ko: '자산',   ic: '💎', desc: '밖으로 나갈 수 있다. 글·부품·결정이 됐다.' },
];
export const STAGE_IDS = STAGES.map((s) => s.id);

// 종류 — 라우터가 자동으로 정한다 (사장님 책장 분류 규칙을 코드로)
export const KINDS = [
  { id: 'thought', ko: '생각',   ic: '💭', c: '#f2622f' },
  { id: 'todo',    ko: '할 일',  ic: '✅', c: '#3c8f6b' },
  { id: 'event',   ko: '일정',   ic: '📅', c: '#4a6fb0' },
  { id: 'ref',     ko: '자료',   ic: '🔗', c: '#8a5cc4' },
  { id: 'question',ko: '질문',   ic: '❓', c: '#b0504a' },
  { id: 'decision',ko: '결정',   ic: '⚖️', c: '#c49a2e' },
];

// 근거 상태 — 그럴듯한 추측이 가장 비싼 버그다 (모닥 · 애월)
export const VERIFY = [
  { id: 'unknown',  ko: '미확인', ic: '○', c: '#97897c', desc: '아직 확인 안 함' },
  { id: 'verified', ko: '확인됨', ic: '◉', c: '#3c8f6b', desc: '출처를 직접 확인함' },
  { id: 'inferred', ko: '추론',   ic: '◐', c: '#c49a2e', desc: 'AI/내 추측 — 확인 필요' },
];

const EMPTY = { v: 1, items: [], decisions: [], usage: {}, nudge: {}, meta: { born: null } };

/* ── 저장 ────────────────────────────────────────────────── */
let _db = null;

function load() {
  if (_db) return _db;
  if (!isBrowser) return (_db = structuredClone(EMPTY));
  try {
    const raw = window.localStorage.getItem(KEY);
    _db = raw ? { ...structuredClone(EMPTY), ...JSON.parse(raw) } : structuredClone(EMPTY);
  } catch {
    _db = structuredClone(EMPTY);
  }
  if (!_db.meta.born) _db.meta.born = Date.now();
  return _db;
}
function save() {
  if (!isBrowser) return;
  try { window.localStorage.setItem(KEY, JSON.stringify(_db)); } catch {}
  window.dispatchEvent(new CustomEvent('aramos:change'));
}
export function onChange(fn) {
  if (!isBrowser) return () => {};
  const h = () => fn();
  window.addEventListener('aramos:change', h);
  window.addEventListener('storage', h);
  return () => { window.removeEventListener('aramos:change', h); window.removeEventListener('storage', h); };
}

const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad = (n) => (n < 10 ? '0' : '') + n;
export function todayStr(d = new Date()) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return todayStr(d); }

/* ─────────────────────────────────────────────────────────
   자동 분류 라우터
   "기록의 병목은 저장이 아니라 분류였다. 분류를 AI에게 넘겼다." — 세계로
   여기서는 AI 없이도 도는 규칙 라우터. 틀리면 사람이 한 번 눌러 고치고,
   고친 건 다시 안 묻는다.
   ───────────────────────────────────────────────────────── */

const RE_URL      = /https?:\/\/[^\s]+/i;
const RE_TIME     = /(\d{1,2})\s*시(\s*(\d{1,2})\s*분)?|(\d{1,2}):(\d{2})|오전|오후/;
const RE_MD       = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
const RE_REL      = /(오늘|내일|모레|글피|이번\s*주|다음\s*주|차주|월말|이번\s*달)/;
const RE_DEADLINE = /(까지|마감|데드라인|기한|deadline|due)/i;
const RE_DONE     = /(했음|했어|완료|끝냄|끝났|처리함|done\b)/i;
const RE_DECISION = /(정했|하기로|결정|확정|승인|채택|가기로|접기로|안\s*하기로)/;
const RE_QUESTION = /[?？]\s*$|(왜|어떻게|뭐가|무엇|어디서|언제|할까|일까|맞나|인가)\s*[?？]?\s*$/;
const RE_TODO     = /(하기|해야|해야지|처리|준비|보내|보내기|작성|정리|검토|확인|예약|신청|결제|전화|미팅잡|사야|사기)/;
const RE_TAG      = /#([\w가-힣][\w가-힣-]*)/g;

// 상대 날짜 → YYYY-MM-DD
function parseDue(text) {
  const md = text.match(RE_MD);
  if (md) {
    const y = new Date().getFullYear();
    return y + '-' + pad(Number(md[1])) + '-' + pad(Number(md[2]));
  }
  const rel = text.match(RE_REL);
  if (rel) {
    const w = rel[1].replace(/\s/g, '');
    if (w === '오늘') return todayStr();
    if (w === '내일') return addDays(1);
    if (w === '모레') return addDays(2);
    if (w === '글피') return addDays(3);
    if (w === '이번주') return addDays(7 - new Date().getDay());
    if (w === '다음주' || w === '차주') return addDays(7);
    if (w === '월말' || w === '이번달') {
      const d = new Date(); return todayStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    }
  }
  return null;
}

/**
 * 한 줄을 받아 무엇인지 판정한다.
 * 컨테이너가 아니라 내용물이 목적지를 정한다. (사장님 책장 규칙)
 */
export function classify(text) {
  const t = String(text || '').trim();
  const tags = [...t.matchAll(RE_TAG)].map((m) => m[1]);
  const url = (t.match(RE_URL) || [null])[0];
  const due = parseDue(t);
  const hasTime = RE_TIME.test(t);

  let kind = 'thought';
  let why = '특별한 신호가 없으면 생각으로 둔다';

  if (RE_DONE.test(t)) {
    kind = 'todo'; why = '"~했음" 완료 신호 — 할 일로 잡고 바로 완료 처리';
  } else if (url) {
    kind = 'ref'; why = '링크가 있으면 자료 — 나중에 꺼내 쓸 재료';
  } else if (RE_DECISION.test(t)) {
    kind = 'decision'; why = '"정했다/하기로" — 결정은 카드로 남긴다';
  } else if (due && hasTime) {
    kind = 'event'; why = '날짜 + 시간이 같이 있으면 일정';
  } else if (RE_DEADLINE.test(t) || (due && RE_TODO.test(t))) {
    kind = 'todo'; why = '마감이 붙은 할 일';
  } else if (RE_QUESTION.test(t)) {
    kind = 'question'; why = '물음표로 끝나면 질문 — 되묻기로 보낸다';
  } else if (RE_TODO.test(t)) {
    kind = 'todo'; why = '행동 동사가 있으면 할 일';
  } else if (due) {
    kind = 'event'; why = '날짜만 있으면 일정으로 둔다';
  }

  return {
    kind, why, tags, due,
    src: url || null,
    // 링크는 내가 아직 안 읽었다 → 미확인이 기본값 (모닥의 verified 필드)
    verified: url ? 'unknown' : 'verified',
    done: RE_DONE.test(t),
  };
}

/* ── 항목 CRUD ───────────────────────────────────────────── */

/** 한 줄 던지기 — 마찰 0. 이게 시스템의 유일한 입구다. */
export function capture(text, patch = {}) {
  const db = load();
  const t = String(text || '').trim();
  if (!t) return null;
  const c = classify(t);
  const item = {
    id: uid(),
    text: t,
    kind: patch.kind || c.kind,
    routeWhy: c.why,
    stage: 'inbox',
    verified: patch.verified || c.verified,
    tags: patch.tags || c.tags,
    due: patch.due !== undefined ? patch.due : c.due,
    src: patch.src !== undefined ? patch.src : c.src,
    done: patch.done !== undefined ? patch.done : c.done,
    note: '',
    from: patch.from || null,     // 어느 크루 유전자에서 왔나
    part: patch.part || null,     // 지도의 어느 부품과 연결되나
    ts: Date.now(),
    ups: [],                      // 승격 이력
  };
  db.items.unshift(item);
  save();
  return item;
}

export function getItems(filter = {}) {
  const db = load();
  let out = db.items.slice();
  if (filter.stage) out = out.filter((i) => i.stage === filter.stage);
  if (filter.kind) out = out.filter((i) => i.kind === filter.kind);
  if (filter.verified) out = out.filter((i) => i.verified === filter.verified);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    out = out.filter((i) => (i.text + ' ' + (i.tags || []).join(' ') + ' ' + (i.note || '')).toLowerCase().includes(q));
  }
  if (filter.openTodo) out = out.filter((i) => i.kind === 'todo' && !i.done);
  return out;
}
export function getItem(id) { return load().items.find((i) => i.id === id) || null; }

export function updateItem(id, patch) {
  const db = load();
  const i = db.items.findIndex((x) => x.id === id);
  if (i === -1) return null;
  db.items[i] = { ...db.items[i], ...patch };
  save();
  return db.items[i];
}
export function removeItem(id) {
  const db = load();
  db.items = db.items.filter((i) => i.id !== id);
  save();
}

/** 승격 — 한 칸 위로. 되돌리기도 된다. */
export function promote(id, dir = 1) {
  const it = getItem(id);
  if (!it) return null;
  const at = STAGE_IDS.indexOf(it.stage);
  const nx = Math.max(0, Math.min(STAGE_IDS.length - 1, at + dir));
  if (nx === at) return it;
  const ups = (it.ups || []).concat([{ to: STAGE_IDS[nx], ts: Date.now() }]);
  return updateItem(id, { stage: STAGE_IDS[nx], ups });
}
export function setVerified(id, v) { return updateItem(id, { verified: v }); }
export function toggleDone(id) {
  const it = getItem(id);
  return it ? updateItem(id, { done: !it.done }) : null;
}

/* ─────────────────────────────────────────────────────────
   결정 카드 — "대신 결정해주지 않고 스스로 결론에 닿게 한다" (르니)
   결정·기준·리스크·첫걸음 4칸. 쌓이면 다시 꺼내 쓴다.
   ───────────────────────────────────────────────────────── */
export function addDecision(d) {
  const db = load();
  const rec = {
    id: 'd' + Date.now().toString(36),
    q: (d.q || '').trim(),
    decision: (d.decision || '').trim(),
    criteria: (d.criteria || '').trim(),
    risk: (d.risk || '').trim(),
    firstStep: (d.firstStep || '').trim(),
    fromItem: d.fromItem || null,
    ts: Date.now(),
  };
  db.decisions.unshift(rec);
  save();
  return rec;
}
export function getDecisions() { return load().decisions.slice(); }
export function removeDecision(id) {
  const db = load();
  db.decisions = db.decisions.filter((d) => d.id !== id);
  save();
}

/* ─────────────────────────────────────────────────────────
   사용 로그 — "만들어서 배포까지 했는데 정작 내가 안 쓰게 됐다" (웃는돌)
   기능을 더 붙이기 전에, 안 쓰는 게 뭔지부터 드러낸다.
   ───────────────────────────────────────────────────────── */
export function logVisit(path) {
  if (!isBrowser) return;
  const db = load();
  const p = path || location.pathname;
  const u = db.usage[p] || { n: 0, first: Date.now(), last: 0 };
  u.n += 1; u.last = Date.now();
  db.usage[p] = u;
  save();
}
export function getUsage() { return { ...load().usage }; }
/** 지도 항목 목록을 주면 "한 번도 안 열어본 것 / 오래 안 연 것"을 돌려준다. */
export function coldSpots(paths, days = 14) {
  const u = getUsage();
  const cut = Date.now() - days * 864e5;
  const never = [], cold = [];
  paths.forEach((p) => {
    const r = u[p];
    if (!r) never.push(p);
    else if (r.last < cut) cold.push({ path: p, last: r.last, n: r.n });
  });
  return { never, cold };
}

/* ─────────────────────────────────────────────────────────
   먼저 말 거는 루프 — "봇이 한 번만 오는 게 아니라 반응 없으면 다시 온다" (잭)
   내가 열어야 도는 시스템은 안 돈다. (다니 · 골프청년)
   ───────────────────────────────────────────────────────── */
export function nudge() {
  const db = load();
  const today = todayStr();
  if (db.nudge.snoozeUntil && Date.now() < db.nudge.snoozeUntil) return null;

  const items = db.items;
  const overdue = items.filter((i) => i.kind === 'todo' && !i.done && i.due && i.due < today);
  const dueToday = items.filter((i) => i.kind === 'todo' && !i.done && i.due === today);
  const inbox = items.filter((i) => i.stage === 'inbox');
  const unverified = items.filter((i) => i.verified === 'unknown');
  // 이틀 넘게 인박스에 그대로 있는 것 — 던지기만 하고 안 꺼내 쓰는 상태 (딜런: "어려운 건 출구다")
  const stale = inbox.filter((i) => Date.now() - i.ts > 2 * 864e5);

  if (overdue.length) return { level: 'hot', ic: '🔴', msg: `기한이 지난 할 일 ${overdue.length}건이 있어요.`, to: '/inbox?f=todo', n: overdue.length };
  if (dueToday.length) return { level: 'warm', ic: '📌', msg: `오늘 마감인 할 일 ${dueToday.length}건.`, to: '/inbox?f=todo', n: dueToday.length };
  if (stale.length >= 3) return { level: 'warm', ic: '🗂', msg: `인박스에 이틀 넘게 묵은 게 ${stale.length}건. 한 칸씩 올려볼까요?`, to: '/inbox', n: stale.length };
  if (unverified.length >= 5) return { level: 'cool', ic: '🔍', msg: `아직 확인 안 한 자료 ${unverified.length}건. 근거부터 붙일까요?`, to: '/inbox?f=unknown', n: unverified.length };
  if (inbox.length >= 8) return { level: 'cool', ic: '📥', msg: `인박스 ${inbox.length}건. 쌓이기만 하면 자산이 안 돼요.`, to: '/inbox', n: inbox.length };

  // 오늘 아무것도 안 던졌으면 먼저 말 건다 (지수의 리버스 저널링)
  const todayCaptured = items.filter((i) => todayStr(new Date(i.ts)) === today);
  if (!todayCaptured.length && new Date().getHours() >= 11) {
    return { level: 'cool', ic: '💭', msg: '오늘은 아직 아무것도 안 던지셨어요. 한 줄이면 충분해요.', to: '#capture', n: 0 };
  }
  return null;
}
/** 지금은 됐다 — n시간 뒤에 다시 온다. 영구 무시는 없다. */
export function snooze(hours = 4) {
  const db = load();
  db.nudge.snoozeUntil = Date.now() + hours * 36e5;
  save();
}

/* ── 통계 ────────────────────────────────────────────────── */
export function stats() {
  const db = load();
  const it = db.items;
  const byStage = {};
  STAGE_IDS.forEach((s) => { byStage[s] = it.filter((i) => i.stage === s).length; });
  const byKind = {};
  KINDS.forEach((k) => { byKind[k.id] = it.filter((i) => i.kind === k.id).length; });
  const today = todayStr();
  const days = Math.max(1, Math.ceil((Date.now() - (db.meta.born || Date.now())) / 864e5));
  return {
    total: it.length,
    byStage, byKind,
    today: it.filter((i) => todayStr(new Date(i.ts)) === today).length,
    openTodo: it.filter((i) => i.kind === 'todo' && !i.done).length,
    unverified: it.filter((i) => i.verified === 'unknown').length,
    assets: byStage.asset || 0,
    decisions: db.decisions.length,
    // 승격률 — 던진 것 중 몇 %가 자산까지 올라갔나. 기록이 아니라 승격이 핵심.
    promoteRate: it.length ? Math.round(((byStage.wiki + byStage.asset) / it.length) * 100) : 0,
    days,
    streak: streak(it),
  };
}
function streak(items) {
  const set = new Set(items.map((i) => todayStr(new Date(i.ts))));
  let n = 0;
  for (let d = 0; d < 400; d++) {
    const day = todayStr(new Date(Date.now() - d * 864e5));
    if (set.has(day)) n++;
    else if (d > 0) break;
  }
  return n;
}

/* ── 백업 / 복원 — 데이터는 내 것이다 ────────────────────── */
export function exportAll() { return JSON.stringify(load(), null, 2); }
export function importAll(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  _db = { ...structuredClone(EMPTY), ...data };
  save();
  return stats();
}
export function clearAll() { _db = structuredClone(EMPTY); _db.meta.born = Date.now(); save(); }

/* ── 첫 실행 씨앗 — 빈 화면은 아무것도 안 가르쳐준다 (민트·나로) ── */
export function seedIfEmpty() {
  const db = load();
  if (db.items.length) return false;
  [
    '아라미러 DNA 페이지에 크루 147명 코어 정리 #아람미러',
    'https://hyun-arch.github.io/dna/ 이식 현황판 확인',
    '내일 오전 10시 경영회의',
    '이번 주까지 흑자전환 OS 지표 정리하기 #경영',
    '기록이 아니라 승격이 핵심이다 — 던진 게 자산이 되려면 계단이 있어야 한다',
  ].forEach((t) => capture(t));
  return true;
}
