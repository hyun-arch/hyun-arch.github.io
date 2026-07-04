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
