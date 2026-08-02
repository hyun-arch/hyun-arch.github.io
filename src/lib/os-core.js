// ─────────────────────────────────────────────────────────────
// 아람미러 OS 커널 (os-core)
//
// 아람미러 전체가 공유하는 단 하나의 저장소·데이터 모델.
//
// 이 커널이 지키는 여덟 가지:
//  ⚡ 던지는 순간과 저장되는 순간의 거리를 0으로
//  🎼 저장의 병목은 저장이 아니라 분류 → 라우터가 대신한다
//  ⬆ 기록이 아니라 승격 — 인박스 → 정리 → 지식 → 자산
//  🔍 확인 안 된 건 확인 안 됐다고 데이터에 박아둔다
//  ❓ 결정은 카드로 남고 다시 꺼내 쓸 수 있어야 한다
//  🔁 내가 열어야 도는 시스템은 안 돈다 → 먼저 말 건다
//  🪞 안 쓰는 기능은 드러나야 한다 → 사용 로그
//  🔒 데이터는 이 브라우저에만 산다. 서버로 안 나간다
//
// 저장 위치 : localStorage 단일 키. 서버 전송 없음.
// ─────────────────────────────────────────────────────────────

const KEY = 'aramirror.os.v1';
const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

/* ── 모델 상수 ───────────────────────────────────────────── */

// 승격 4단계 — 기록이 아니라 승격이 핵심
export const STAGES = [
  { id: 'inbox',  ko: '인박스', ic: '📥', desc: '던져진 그대로. 아직 아무 판단도 안 했다.' },
  { id: 'sorted', ko: '정리됨', ic: '🗂', desc: '무엇인지 정해졌다. 종류·태그·기한이 붙었다.' },
  { id: 'wiki',   ko: '지식',   ic: '🧠', desc: '다른 것과 엮였다. 다시 꺼내 쓸 수 있는 상태.' },
  { id: 'asset',  ko: '자산',   ic: '💎', desc: '밖으로 나갈 수 있다. 글·부품·결정이 됐다.' },
];
export const STAGE_IDS = STAGES.map((s) => s.id);

// 종류 — 라우터가 자동으로 정한다
export const KINDS = [
  { id: 'thought', ko: '생각',   ic: '💭', c: '#f2622f' },
  { id: 'todo',    ko: '할 일',  ic: '✅', c: '#3c8f6b' },
  { id: 'event',   ko: '일정',   ic: '📅', c: '#4a6fb0' },
  { id: 'ref',     ko: '자료',   ic: '🔗', c: '#8a5cc4' },
  { id: 'question',ko: '질문',   ic: '❓', c: '#b0504a' },
  { id: 'decision',ko: '결정',   ic: '⚖️', c: '#c49a2e' },
];

// 근거 상태 — 그럴듯한 추측이 가장 비싼 버그다
export const VERIFY = [
  { id: 'unknown',  ko: '미확인', ic: '○', c: '#97897c', desc: '아직 확인 안 함' },
  { id: 'verified', ko: '확인됨', ic: '◉', c: '#3c8f6b', desc: '출처를 직접 확인함' },
  { id: 'inferred', ko: '추론',   ic: '◐', c: '#c49a2e', desc: 'AI/내 추측 — 확인 필요' },
];

const EMPTY = {
  v: 1, items: [], decisions: [], usage: {}, nudge: {}, meta: { born: null },
  // 코어 — 되묻는 자리. 답이 아니라 질문이 나를 깊게 만든다.
  core: { answers: [], principles: [], dives: [], meets: [], balance: [] },
};

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
   "기록의 병목은 저장이 아니라 분류였다. 분류를 AI에게 넘겼다."
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
 * 컨테이너가 아니라 내용물이 목적지를 정한다.
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
    // 링크는 내가 아직 안 읽었다 → 미확인이 기본값
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
    // 기본은 인박스. 단, 되묻기에 답한 것처럼 이미 판단이 붙은 건 위 칸에서 시작한다.
    stage: STAGE_IDS.includes(patch.stage) ? patch.stage : 'inbox',
    verified: patch.verified || c.verified,
    tags: patch.tags || c.tags,
    due: patch.due !== undefined ? patch.due : c.due,
    src: patch.src !== undefined ? patch.src : c.src,
    done: patch.done !== undefined ? patch.done : c.done,
    note: patch.note || '',       // 이 한 줄이 무슨 질문의 답이었나
    src2: patch.src2 || null,     // 어디서 들어왔나 (텔레그램·웹 등)
    part: patch.part || null,     // 지도의 어느 부품과 연결되나
    ts: Date.now(),
    // 승격 이력. 위 칸에서 시작했으면 거기까지 올라온 것으로 정직하게 기록한다.
    ups: STAGE_IDS.includes(patch.stage) && patch.stage !== 'inbox'
      ? STAGE_IDS.slice(1, STAGE_IDS.indexOf(patch.stage) + 1).map((to) => ({ to, ts: Date.now() }))
      : [],
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
   결정 카드 — "대신 결정해주지 않고 스스로 결론에 닿게 한다"
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
   사용 로그 — "만들어서 배포까지 했는데 정작 내가 안 쓰게 됐다"
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
   먼저 말 거는 루프 — "봇이 한 번만 오는 게 아니라 반응 없으면 다시 온다"
   내가 열어야 도는 시스템은 안 돈다.
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

  // 오늘 아무것도 안 던졌으면 먼저 말 건다
  const todayCaptured = items.filter((i) => todayStr(new Date(i.ts)) === today);
  if (!todayCaptured.length && new Date().getHours() >= 11) {
    return { level: 'cool', ic: '💭', msg: '오늘은 아직 아무것도 안 던지셨어요. 한 줄이면 충분해요.', to: '#capture', n: 0 };
  }

  // 급한 게 없는 날일수록 깊어질 자리가 있다 — 오늘의 한 질문
  if (!db.core.answers.some((a) => a.date === today) && new Date().getHours() >= 9) {
    return { level: 'cool', ic: '🪨', msg: '오늘 나에게 한 번도 안 물었어요. 한 질문, 한 줄.', to: '/core', n: 0 };
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

/* ═══════════════════════════════════════════════════════════
   코어 — 되묻는 자리

   여기는 무언가를 더 넣는 곳이 아니라, 하루에 딱 하나를 묻는 곳이다.
   묻는 방식은 다섯 가지 원칙을 따른다.
     ① 한 번에 하나만 묻는다 — 세 개 물으면 셋 다 얕아진다
     ② 사실이 아니라 판단을 묻는다 — "몇 시간?"이 아니라 "왜 그게 오늘이었나"
     ③ '왜 지금'을 묻는다 — 지금 걸린 것에만 답할 값어치가 있다
     ④ 읽은 것과 잇는다 — 새 생각은 늘 옛 생각 옆에서 나온다
     ⑤ 들은 것을 되비춘다 — 내가 한 말을 내가 다시 본다

   답은 한 줄이면 된다. 답하는 즉시 승격 파이프라인으로 들어간다.
   ═══════════════════════════════════════════════════════════ */

// 세 축 — 5주를 지나며 내가 직접 고른 방향
export const AXES = [
  { id: 'self',    ko: '나에게 깊어지기', ic: '🕳', c: '#f2622f' },
  { id: 'people',  ko: '사람과 깊어지기', ic: '🤝', c: '#c4547f' },
  { id: 'balance', ko: '시간의 균형',     ic: '⚖️', c: '#4a6fb0' },
];

const QUESTIONS = {
  self: [
    '오늘 가장 오래 붙잡았던 것 하나. 그게 왜 하필 오늘이었나?',
    '오늘 한 일 중, 안 했어도 아무 일 없었을 것 하나는?',
    '지금 머리를 가장 무겁게 하는 것을 문장 하나로 적어라.',
    "이번 주에 '안다'고 말했지만 사실 확인 안 해본 것은?",
    '오늘 미룬 것 하나. 미룬 진짜 이유는 시간이었나, 두려움이었나?',
    '지금 하는 일을 3년 뒤의 내가 본다면 뭐라고 할까. 한 줄.',
    '오늘 깊이 들어간 순간은 몇 분이었나. 없었다면 무엇이 막았나?',
    '요즘 반복해서 떠오르는 생각 하나. 왜 자꾸 돌아오나?',
    '지금 붙잡고 있는 것 중, 놓아도 되는 것 하나는?',
    '오늘 나에게 실망한 지점. 기준이 높아서였나, 준비가 없어서였나?',
    '내가 지금 잘하고 있다는 증거를 하나만 대라. 느낌 말고 증거로.',
    '오늘 한 결정 중 근거 없이 내린 것이 있었나?',
  ],
  people: [
    '오늘 만난 사람 한 명. 그 사람에 대해 새로 알게 된 것 하나는?',
    '이번 주에 꼭 물어보고 싶은 사람과 그 질문 하나를 적어라.',
    '최근 대화에서 내가 말한 시간과 들은 시간, 어느 쪽이 길었나?',
    '도움을 받았는데 아직 갚지 못한 사람은?',
    '관계가 얕다고 느끼는 사람 하나. 얕은 이유는 무엇인가?',
    '오늘 누군가의 말 중 나를 찔렀던 문장 하나는?',
    '다음 미팅에서 내가 얻고 싶은 것 말고, 줄 수 있는 것 하나는?',
    '최근에 나에게 솔직한 말을 해준 사람은 누구였나?',
    '자주 미루는 연락 하나. 왜 미루나?',
    '이번 주 대화 중 가장 농밀했던 5분은 언제였나?',
    '내가 없어도 잘 돌아가게 하려면, 누구에게 무엇을 넘겨야 하나?',
    '오늘 누군가에게 한 말 중 후회되는 것이 있나?',
  ],
  balance: [
    '오늘 혼자였던 시간과 사람과 있던 시간. 어느 쪽이 나를 채웠나?',
    '오늘 흘려보낸 시간이 있었다면 어디서였나. 정직하게.',
    '이번 주에 가장 잘 쓴 30분은 언제였나?',
    '지금 일정표에서 지워도 되는 것 하나는?',
    '오늘 몸은 어땠나. 그게 오늘 판단에 영향을 줬나?',
    "이번 주 '해야 한다'고 적어놓고 안 한 것. 진짜 해야 하는 게 맞나?",
    '내일 하루에 딱 하나만 할 수 있다면 무엇인가?',
    '요즘 쉬는 것과 도망치는 것을 구분할 수 있나?',
    '운동한 날과 안 한 날, 생각의 질이 달랐나?',
    '지금 속도는 지속 가능한가. 아니라면 무엇을 줄일 것인가?',
    '오늘 가장 마찰이 컸던 순간은 언제였나?',
    '이번 주 나를 가장 많이 방해한 것 하나는?',
  ],
};

/** 오늘의 한 질문 — 축을 돌아가며, 하루에 하나만. */
export function askToday() {
  const db = load();
  const today = todayStr();
  const done = db.core.answers.find((a) => a.date === today);
  if (done) return { ...done, answered: true };

  // 축은 순환한다. 어제 나에게 물었으면 오늘은 사람에게.
  const last = db.core.answers[db.core.answers.length - 1];
  const li = last ? AXES.findIndex((x) => x.id === last.axis) : -1;
  const axis = AXES[(li + 1) % AXES.length];

  // 같은 질문이 연달아 오지 않게 — 최근 6개는 피한다
  const recent = db.core.answers.slice(-6).map((a) => a.q);
  const pool = QUESTIONS[axis.id].filter((q) => !recent.includes(q));
  const list = pool.length ? pool : QUESTIONS[axis.id];
  const seed = [...today].reduce((s, c) => s + c.charCodeAt(0), 0);
  return { date: today, axis: axis.id, q: list[seed % list.length], answered: false };
}

/** 답한다 → 그대로 파이프라인으로 들어간다. 되묻기가 곧 캡처다. */
export function answerToday(text, ask = null) {
  const t = String(text || '').trim();
  if (!t) return null;
  const db = load();
  const a = ask || askToday();
  const today = todayStr();
  db.core.answers = db.core.answers.filter((x) => x.date !== today);
  db.core.answers.push({ date: today, axis: a.axis, q: a.q, a: t, ts: Date.now() });
  save();
  // 답은 자산 후보다 — 인박스가 아니라 '정리됨'에서 시작한다
  return capture(t, { stage: 'sorted', kind: 'thought', tags: ['코어'], note: a.q });
}
export function getAnswers() { return load().core.answers.slice().reverse(); }

/* ── 원칙 — 반복해서 나온 말이 곧 내 철학이다 ─────────────── */
export function getPrinciples() { return load().core.principles.slice(); }
export function addPrinciple(text, status = 'draft') {
  const t = String(text || '').trim();
  if (!t) return null;
  const db = load();
  const p = { id: uid(), t, status, ts: Date.now() };
  db.core.principles.unshift(p);
  save();
  return p;
}
/** 확정 = 내 것으로 삼는다 / 버림 = 버리는 용기 */
export function setPrinciple(id, status) {
  const db = load();
  const p = db.core.principles.find((x) => x.id === id);
  if (!p) return null;
  if (status === 'drop') db.core.principles = db.core.principles.filter((x) => x.id !== id);
  else p.status = status;
  save();
  return p;
}

/* ── 몰입 — 깊이는 시간이 아니라 '몇 번 다시 들어갔나'다 ──── */
export function startDive(topic) {
  const t = String(topic || '').trim();
  if (!t) return null;
  const db = load();
  const d = { id: uid(), topic: t, found: '', start: Date.now(), end: null };
  db.core.dives.unshift(d);
  save();
  return d;
}
export function endDive(id, found = '') {
  const db = load();
  const d = db.core.dives.find((x) => x.id === id);
  if (!d) return null;
  d.end = Date.now();
  d.found = String(found || '').trim();
  save();
  if (d.found) capture(d.found, { stage: 'wiki', kind: 'thought', tags: ['몰입', d.topic] });
  return d;
}
export function getDives() { return load().core.dives.slice(); }
/** 깊이 = 같은 주제로 다시 들어간 최대 횟수. 얕게 열 개보다 깊게 세 번. */
export function depth() {
  const by = {};
  load().core.dives.forEach((d) => { by[d.topic] = (by[d.topic] || 0) + 1; });
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  const mins = load().core.dives.reduce((s, d) => s + (d.end ? (d.end - d.start) / 6e4 : 0), 0);
  return { topics: Object.keys(by).length, best: top ? { topic: top[0], n: top[1] } : null, minutes: Math.round(mins) };
}

/* ── 사람 — 관계의 깊이는 '내가 새로 알게 된 것'의 누적이다 ─ */
export function addMeet(who, ask = '') {
  const w = String(who || '').trim();
  if (!w) return null;
  const db = load();
  const m = { id: uid(), who: w, ask: String(ask || '').trim(), learned: '', ts: Date.now(), done: false };
  db.core.meets.unshift(m);
  save();
  return m;
}
export function closeMeet(id, learned) {
  const db = load();
  const m = db.core.meets.find((x) => x.id === id);
  if (!m) return null;
  m.learned = String(learned || '').trim();
  m.done = true;
  save();
  if (m.learned) capture(`${m.who} — ${m.learned}`, { stage: 'wiki', kind: 'thought', tags: ['사람', m.who] });
  return m;
}
export function getMeets() { return load().core.meets.slice(); }

/* ── 균형 — 하루 한 번만 찍는다. 무거우면 안 찍는다. ──────── */
export function markBalance(mode) {
  const db = load();
  const today = todayStr();
  db.core.balance = db.core.balance.filter((b) => b.date !== today);
  db.core.balance.push({ date: today, mode });
  save();
  return mode;
}
export function balanceWeek() {
  const db = load();
  const days = [];
  for (let d = 6; d >= 0; d--) days.push(todayStr(new Date(Date.now() - d * 864e5)));
  const rows = days.map((date) => ({ date, mode: (db.core.balance.find((b) => b.date === date) || {}).mode || null }));
  const alone = rows.filter((r) => r.mode === 'alone').length;
  const withp = rows.filter((r) => r.mode === 'with').length;
  return { rows, alone, with: withp, marked: alone + withp };
}

/** 코어 요약 — 한 화면에 필요한 숫자만 */
export function coreStats() {
  const db = load();
  const a = db.core.answers;
  const week = new Set();
  for (let d = 0; d < 7; d++) week.add(todayStr(new Date(Date.now() - d * 864e5)));
  return {
    answered: a.length,
    answeredWeek: a.filter((x) => week.has(x.date)).length,
    principles: db.core.principles.filter((p) => p.status === 'kept').length,
    drafts: db.core.principles.filter((p) => p.status === 'draft').length,
    depth: depth(),
    learned: db.core.meets.filter((m) => m.done && m.learned).length,
    openMeets: db.core.meets.filter((m) => !m.done).length,
    balance: balanceWeek(),
  };
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

/* ── 첫 실행 씨앗 — 빈 화면은 아무것도 안 가르쳐준다 ── */
/**
 * 원칙 씨앗 — 내가 5주 동안 실제로 쓴 문장들.
 * 남이 준 격언이 아니라 내 입에서 나온 말이라, 확정하든 버리든 내 몫이다.
 * 확정한 것만 원칙이 된다. 버리는 것도 결정이다.
 */
const SEED_PRINCIPLES = [
  'AI는 나를 대신하지 않는다 — 거울이 된다.',
  '쌓이는 건 그냥 쌓인다. 자산이 되려면 올라가는 계단이 있어야 한다.',
  '한 번에 하나만 묻는다. 셋을 물으면 셋 다 얕아진다.',
  '편한 거짓말보다 불편한 사실.',
  '안 쓰는 기능이 드러나야 버릴 수 있다.',
  '보안은 자물쇠 UI가 아니라 데이터가 어디 사는가다.',
  '내가 열어야 도는 시스템은 안 돈다.',
  '정답은 없다. 계속 부딪히는 수밖에 없다.',
  '깊어지려면 나만의 원칙이 뿌리내려야 한다.',
  '자산은 혼자 쌓는 게 아니라, 남이 쓸 때 자산이 된다.',
];

export function seedPrinciplesIfEmpty() {
  const db = load();
  if (db.core.principles.length) return false;
  db.core.principles = SEED_PRINCIPLES.map((t) => ({ id: uid(), t, status: 'draft', ts: Date.now() }));
  save();
  return true;
}

export function seedIfEmpty() {
  const db = load();
  if (db.items.length) return false;
  [
    '아람미러 첫 화면에 오늘 할 일 한 줄만 띄우기 #아람미러',
    '내일 오전 10시 경영회의',
    '이번 주까지 흑자전환 OS 지표 정리하기 #경영',
    '기록이 아니라 승격이 핵심이다 — 던진 게 자산이 되려면 계단이 있어야 한다',
  ].forEach((t) => capture(t));
  return true;
}
