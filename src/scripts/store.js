// Aramirror — 데이터 레이어 (이중 모드)
//  · Supabase 설정이 있으면(config.js) → 서버 CRUD (다중 기기/사용자 공유, 영속)
//  · 없으면 → localStorage 폴백 (단일 브라우저)
// 게시판 글은 캐시(_cache) 기반으로 동기 조회하고, 변경(생성/수정/삭제)은 async다.
// 웹페이지 상위 관리는 이 사이트의 라우트 설정이라 localStorage에 유지한다.

import { hasSupabase } from '../lib/config.js';
import { sbList, sbInsert, sbUpdate, sbDelete } from '../lib/backend.js';

const POSTS_KEY = 'aramirror.board.v1';
const PAGES_KEY = 'aramirror.pages.v1';

export const CATEGORIES = ['생각', '빌드로그', '글', '공유회', '공지'];
export const backendMode = () => (hasSupabase() ? 'supabase' : 'local');

// ── 게시판 시드 (localStorage 폴백 첫 실행 시 주입) ────────────
const SEED_POSTS = [
  { id: 'seed-genesis', title: 'Genesis — 텔레그램 한 줄에서 시작된 OS', category: '빌드로그',
    tags: ['Aramirror', 'OS', 'Telegram'],
    body: '메모앱이 아니라 "내 생각이 값(자산)이 되는 환경"을 만들었다. 텔레그램으로 던지면 저널에 누적되고, 밤마다 위키로 승격되고, 아라미러로 발행된다.',
    status: 'published', date: '2026-06-29', updated: '2026-06-29' },
  { id: 'seed-flow', title: 'Flow — 몰입, 그리고 알을 깨는 새', category: '빌드로그',
    tags: ['Flow', '몰입'],
    body: '시간을 한 방울씩. 몰입 타이머와 몰입 기록으로 집중의 리듬을 자산으로 남긴다.',
    status: 'published', date: '2026-07-03', updated: '2026-07-03' },
  { id: 'seed-share-0704', title: '0704 에이든의 이기적스폰지 공유회 — 초중급 정리', category: '공유회',
    tags: ['ClaudeCode', '스킬', '서브에이전트', 'CRUD', 'KEY연결'],
    body: '재활용이 자동화의 핵심 = 스킬. 스킬과 서브에이전트는 본질적으로 같다. .env 하나에서 GitHub·Supabase·Vercel로 배선 — 한 번이 힘들지 그다음은 쭉 편해진다. 실습 산출물: 어드민 게시판(BASEBOARD).',
    status: 'published', date: '2026-07-04', updated: '2026-07-04' },
];

const SEED_PAGES = [
  { path: '/', label: '홈', visible: true, note: '히어로 · The Loop' },
  { path: '/wall', label: '생각의 벽', visible: true, note: '자산 ↔ 연료 분리' },
  { path: '/architecture', label: 'Architecture', visible: true, note: '' },
  { path: '/agents', label: 'Agents', visible: true, note: '' },
  { path: '/build-logs', label: 'Build Logs', visible: true, note: '개발일지' },
  { path: '/writings', label: '글', visible: true, note: '' },
  { path: '/flow', label: '몰입 · Flow', visible: true, note: '몰입 타이머' },
  { path: '/publish', label: '발행', visible: true, note: 'SNS 발행' },
  { path: '/board', label: '게시판', visible: true, note: 'CRUD 게시판' },
];

// ── 내부 유틸 ────────────────────────────────────────────────
const isBrowser = typeof window !== 'undefined' && !!window.localStorage;
let _cache = null; // 게시판 글 캐시(배열)

function read(key, fallback) {
  if (!isBrowser) return structuredClone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch { return structuredClone(fallback); }
}
function write(key, value) {
  if (isBrowser) window.localStorage.setItem(key, JSON.stringify(value));
}
function fire() {
  if (isBrowser) window.dispatchEvent(new CustomEvent('aramirror:store'));
}
function today() { return new Date().toISOString().slice(0, 10); }
function nowIso() { return new Date().toISOString(); }
function uid() { return 'p-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags || '').split(',').map((t) => t.trim()).filter(Boolean);
}
// Supabase row → 앱 포스트 형태
function normalize(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || '생각',
    tags: Array.isArray(row.tags) ? row.tags : normalizeTags(row.tags),
    body: row.body || '',
    status: row.status === 'draft' ? 'draft' : 'published',
    date: (row.date || '').slice(0, 10),
    updated: (row.updated_at || row.date || '').slice(0, 10),
  };
}

// ── 초기화 (페이지 로드 시 1회 await) ─────────────────────────
export async function init() {
  if (backendMode() === 'supabase') {
    try {
      const rows = await sbList();
      _cache = rows.map(normalize);
    } catch (e) {
      console.error('[aramirror] Supabase 조회 실패, 빈 목록으로 시작:', e.message);
      _cache = [];
    }
  } else {
    _cache = read(POSTS_KEY, null) ?? (write(POSTS_KEY, SEED_POSTS), structuredClone(SEED_POSTS));
  }
  fire();
  return _cache;
}

// ── 게시판 글 조회 (캐시 기반, 동기) ──────────────────────────
export function getPosts() {
  if (_cache) return _cache;
  // 아직 init 전: 로컬 모드면 즉시 하이드레이트, 서버 모드면 빈 배열
  if (backendMode() === 'local') {
    _cache = read(POSTS_KEY, null) ?? (write(POSTS_KEY, SEED_POSTS), structuredClone(SEED_POSTS));
    return _cache;
  }
  return [];
}
export function getPost(id) { return getPosts().find((p) => p.id === id) || null; }

// ── 게시판 글 CRUD (async) ────────────────────────────────────
export async function createPost(input) {
  const fields = {
    title: (input.title || '무제').trim(),
    category: input.category || '생각',
    tags: normalizeTags(input.tags),
    body: input.body || '',
    status: input.status === 'draft' ? 'draft' : 'published',
    date: input.date || today(),
  };
  if (backendMode() === 'supabase') {
    const row = await sbInsert(fields);
    _cache = [normalize(row), ...getPosts()];
  } else {
    const post = { id: uid(), ...fields, updated: today() };
    _cache = [post, ...getPosts()];
    write(POSTS_KEY, _cache);
  }
  fire();
  return _cache[0];
}

export async function updatePost(id, patch) {
  const fields = {};
  for (const k of ['title', 'category', 'body', 'status', 'date']) if (patch[k] !== undefined) fields[k] = patch[k];
  if (patch.tags !== undefined) fields.tags = normalizeTags(patch.tags);

  if (backendMode() === 'supabase') {
    const row = await sbUpdate(id, { ...fields, updated_at: nowIso() });
    _cache = getPosts().map((p) => (p.id === id ? normalize(row) : p));
  } else {
    _cache = getPosts().map((p) => (p.id === id ? { ...p, ...fields, updated: today() } : p));
    write(POSTS_KEY, _cache);
  }
  fire();
  return getPost(id);
}

export async function deletePost(id) {
  if (backendMode() === 'supabase') await sbDelete(id);
  _cache = getPosts().filter((p) => p.id !== id);
  if (backendMode() === 'local') write(POSTS_KEY, _cache);
  fire();
}

export async function togglePublish(id) {
  const p = getPost(id);
  if (!p) return null;
  return updatePost(id, { status: p.status === 'published' ? 'draft' : 'published' });
}

// ── 웹페이지 상위 관리 (localStorage) ─────────────────────────
export function getPages() {
  const data = read(PAGES_KEY, null);
  if (data === null) { write(PAGES_KEY, SEED_PAGES); return structuredClone(SEED_PAGES); }
  return data;
}
export function togglePageVisibility(path) {
  const pages = getPages();
  const i = pages.findIndex((p) => p.path === path);
  if (i === -1) return;
  pages[i].visible = !pages[i].visible;
  write(PAGES_KEY, pages); fire();
}
export function setPageNote(path, note) {
  const pages = getPages();
  const i = pages.findIndex((p) => p.path === path);
  if (i === -1) return;
  pages[i].note = note;
  write(PAGES_KEY, pages);
}

// ── 통계 ─────────────────────────────────────────────────────
export function stats() {
  const posts = getPosts();
  const pages = getPages();
  return {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    pagesVisible: pages.filter((p) => p.visible).length,
    pagesTotal: pages.length,
  };
}

// ── 백업 / 복원 ──────────────────────────────────────────────
export function exportAll() {
  return JSON.stringify({ version: 2, mode: backendMode(), posts: getPosts(), pages: getPages() }, null, 2);
}
export async function importAll(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (Array.isArray(data.pages)) { write(PAGES_KEY, data.pages); }
  if (Array.isArray(data.posts)) {
    if (backendMode() === 'supabase') {
      for (const p of data.posts) await createPost(p); // 서버로 재삽입(새 id)
    } else {
      _cache = data.posts; write(POSTS_KEY, _cache);
    }
  }
  fire();
  return stats();
}
export async function resetAll() {
  if (backendMode() === 'supabase') { await init(); return; } // 서버 데이터는 보호(재조회만)
  write(POSTS_KEY, SEED_POSTS); write(PAGES_KEY, SEED_PAGES);
  _cache = structuredClone(SEED_POSTS); fire();
}

// ── 변경 구독 ────────────────────────────────────────────────
export function onChange(handler) {
  if (!isBrowser) return () => {};
  const fn = () => handler();
  window.addEventListener('aramirror:store', fn);
  window.addEventListener('storage', fn);
  return () => { window.removeEventListener('aramirror:store', fn); window.removeEventListener('storage', fn); };
}
