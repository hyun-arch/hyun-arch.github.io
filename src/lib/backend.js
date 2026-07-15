// Supabase REST(PostgREST) 직접 호출 래퍼 — 의존성 없이 fetch만 사용.
// posts 테이블에 대한 서버 CRUD를 담당한다.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const rest = (path) => `${SUPABASE_URL}/rest/v1/${path}`;
const baseHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

async function req(url, opts = {}) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Supabase ${opts.method || 'GET'} ${r.status}: ${text.slice(0, 200)}`);
  }
  if (r.status === 204) return null;
  return r.json();
}

// 최신순(작성일 → 생성시각) 정렬해서 전체 조회
export async function sbList() {
  return req(rest('posts?select=*&order=date.desc,created_at.desc'), { headers: baseHeaders() });
}

export async function sbInsert(row) {
  const out = await req(rest('posts'), {
    method: 'POST',
    headers: { ...baseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  return Array.isArray(out) ? out[0] : out;
}

export async function sbUpdate(id, patch) {
  const out = await req(rest(`posts?id=eq.${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { ...baseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  return Array.isArray(out) ? out[0] : out;
}

export async function sbDelete(id) {
  await req(rest(`posts?id=eq.${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: baseHeaders(),
  });
}

// ── 캐러셀 보관함 (carousels 테이블) ─────────────────────────
export async function sbCarouselList() {
  return req(rest('carousels?select=*&order=created_at.desc'), { headers: baseHeaders() });
}

export async function sbCarouselInsert(row) {
  const out = await req(rest('carousels'), {
    method: 'POST',
    headers: { ...baseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  return Array.isArray(out) ? out[0] : out;
}

export async function sbCarouselDelete(id) {
  await req(rest(`carousels?id=eq.${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: baseHeaders(),
  });
}

// ── 릴스 보관함 (videos 테이블) ──────────────────────────────
export async function sbVideoList() {
  return req(rest('videos?select=*&order=created_at.desc'), { headers: baseHeaders() });
}

export async function sbVideoInsert(row) {
  const out = await req(rest('videos'), {
    method: 'POST',
    headers: { ...baseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  return Array.isArray(out) ? out[0] : out;
}

export async function sbVideoDelete(id) {
  await req(rest(`videos?id=eq.${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: baseHeaders(),
  });
}

// ── 활동 로그 (events 테이블) — "지하 엔진실" ─────────────────
// 모든 활동(페이지 열람·몰입 세션·시계 사용 등)이 여기에 시간순으로 쌓인다.
// 밤마다 종합하고 아침 5시 보고에 반영하는 데이터 원천.
export async function sbEventInsert(row) {
  const out = await req(rest('events'), {
    method: 'POST',
    headers: { ...baseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  return Array.isArray(out) ? out[0] : out;
}

// 기간/종류로 조회 (기본: 최근 200건). since = ISO 문자열.
export async function sbEventList({ type, since, limit = 200 } = {}) {
  let q = `events?select=*&order=occurred_at.desc&limit=${limit}`;
  if (type) q += `&type=eq.${encodeURIComponent(type)}`;
  if (since) q += `&occurred_at=gte.${encodeURIComponent(since)}`;
  return req(rest(q), { headers: baseHeaders() });
}
