// 🟡 Supabase Auth (GoTrue) 클라이언트 — 의존성 없이 fetch만 사용.
//
// 준민감(🟡 auth) 데이터를 "진짜 로그인 뒤로" 잠그기 위한 심장.
// 기존 config.js 의 SUPABASE_URL + anon 키를 그대로 쓴다(Auth 엔드포인트도 같은 키 사용).
//
// 저장: 세션(access/refresh 토큰 + 사용자)을 localStorage 에 둔다.
//   - 정적 사이트라 서버 세션이 없으므로 클라이언트 토큰으로 판정한다.
//   - 준민감 데이터의 "진짜" 보호는 이 로그인 + Supabase RLS(authenticated 전용)가 함께 담당한다.
//     → 데이터를 빌드 산출물에 넣지 말고, 로그인 후 이 토큰으로 런타임에 fetch 하는 것이 원칙.
//
// 사장님이 대시보드에서 해줘야 하는 1회 설정(코드로는 못 함):
//   1) Authentication → Providers → Email 켜기 (원하면 "Confirm email" 끄기)
//   2) Authentication → Users → 본인 계정(이메일/비번) 1개 생성
//
// ⚠️ 보안 규칙: 이 파일은 로그인 "구조"만 만든다. 비밀번호 입력·계정 생성은 사장님 본인이 한다.

import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabase } from './config.js';

const KEY = 'aramirror.auth.session';
const authBase = () => `${SUPABASE_URL}/auth/v1`;
const headers = (token) => {
  const h = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

// ── 세션 저장소 ──────────────────────────────────────────────
export function getSession() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(sess) {
  if (typeof localStorage === 'undefined') return;
  if (sess) localStorage.setItem(KEY, JSON.stringify(sess));
  else localStorage.removeItem(KEY);
  // 같은 탭 + 다른 탭 모두에 알림
  try { window.dispatchEvent(new CustomEvent('aram-auth', { detail: sess })); } catch {}
}

// access_token 이 (거의) 만료면 true. expires_at 은 초 단위 epoch.
function isExpired(sess) {
  if (!sess?.expires_at) return true;
  return Date.now() / 1000 > sess.expires_at - 30; // 30초 여유
}

export function getUser() {
  return getSession()?.user || null;
}

export function isAuthed() {
  return Boolean(getSession()?.access_token);
}

// ── 로그인 / 로그아웃 ────────────────────────────────────────
// 성공 시 세션 저장 후 { user } 반환, 실패 시 throw(사람이 읽을 한국어 메시지).
export async function signIn(email, password) {
  if (!hasSupabase()) throw new Error('Supabase 설정이 비어 있습니다(config.js).');
  const r = await fetch(`${authBase()}/token?grant_type=password`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error_description || data?.msg || data?.error || '';
    if (/invalid login|credential/i.test(msg)) throw new Error('이메일 또는 비밀번호가 맞지 않습니다.');
    if (/email not confirmed/i.test(msg)) throw new Error('이메일 인증이 아직 안 됐습니다. (대시보드에서 Confirm email 끄기 권장)');
    throw new Error(msg || `로그인 실패 (${r.status})`);
  }
  setSession(data);
  return { user: data.user };
}

export async function signOut() {
  const sess = getSession();
  if (sess?.access_token) {
    try {
      await fetch(`${authBase()}/logout`, { method: 'POST', headers: headers(sess.access_token) });
    } catch {}
  }
  setSession(null);
}

// 만료됐으면 refresh_token 으로 갱신. 갱신 실패(만료·폐기)면 로그아웃 상태로.
export async function refreshIfNeeded() {
  const sess = getSession();
  if (!sess?.refresh_token) return null;
  if (!isExpired(sess)) return sess;
  try {
    const r = await fetch(`${authBase()}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ refresh_token: sess.refresh_token }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.access_token) throw new Error('refresh failed');
    setSession(data);
    return data;
  } catch {
    setSession(null);
    return null;
  }
}

// 인증된 요청에 쓸 Authorization 헤더(자동 갱신 포함). 미로그인이면 null.
export async function authHeader() {
  const sess = await refreshIfNeeded();
  return sess?.access_token ? { Authorization: `Bearer ${sess.access_token}`, apikey: SUPABASE_ANON_KEY } : null;
}

// 로그인 상태 변화 구독(로그인/로그아웃/다른 탭). 해제 함수 반환.
export function onAuthChange(cb) {
  const local = (e) => cb(e.detail || getSession());
  const cross = (e) => { if (e.key === KEY) cb(getSession()); };
  window.addEventListener('aram-auth', local);
  window.addEventListener('storage', cross);
  return () => {
    window.removeEventListener('aram-auth', local);
    window.removeEventListener('storage', cross);
  };
}

// 🟡 게이트: 로그인 안 돼 있으면 /login 으로 (현재 경로를 redirect 로 넘김).
// 만료 세션이면 먼저 갱신 시도. 반환값 true=통과, false=이동함.
export async function requireAuth() {
  await refreshIfNeeded();
  if (isAuthed()) return true;
  const here = location.pathname + location.search;
  location.href = `/login?redirect=${encodeURIComponent(here)}`;
  return false;
}
