// events.js — "지하 엔진실" 클라이언트.
// 모든 활동을 (1) 항상 localStorage 버퍼에 쌓고 (2) Supabase가 연결돼 있으면 events 테이블에도 적재한다.
// Supabase 테이블이 아직 없거나 오프라인이어도 절대 에러로 앱을 막지 않는다(로컬엔 남는다).
import { hasSupabase } from './config.js';
import { sbEventInsert } from './backend.js';

const BUF_KEY = 'aramirror.events.buffer.v1';
const MAX_BUF = 800; // 로컬 버퍼 상한 (오래된 것부터 버림)

function pushLocal(ev) {
  try {
    const arr = JSON.parse(localStorage.getItem(BUF_KEY) || '[]');
    arr.push(ev);
    localStorage.setItem(BUF_KEY, JSON.stringify(arr.slice(-MAX_BUF)));
  } catch (_) {}
}

// 활동 1건 기록. type=종류(예: 'flow_session'), payload=부가정보(JSON)
export async function logEvent(type, payload = {}) {
  const at = new Date().toISOString();
  const ev = { type, payload, occurred_at: at };
  pushLocal(ev);
  if (!hasSupabase()) return { ok: false, local: true };
  try {
    await sbEventInsert(ev);
    return { ok: true };
  } catch (e) {
    // 테이블 미생성(42P01) 등은 조용히 로컬 보관으로 폴백
    console.warn('[events] Supabase 적재 실패, 로컬에만 보관:', String(e).slice(0, 120));
    return { ok: false, error: String(e), local: true };
  }
}

// 로컬에 쌓인 활동 조회 (밤 종합/디버그용)
export function localEvents() {
  try { return JSON.parse(localStorage.getItem(BUF_KEY) || '[]'); } catch (_) { return []; }
}

// 브라우저 전역에 노출 → is:inline 스크립트(flow 등)에서도 window.aramLog(...)로 호출 가능
if (typeof window !== 'undefined') {
  window.aramLog = logEvent;
  window.aramLocalEvents = localEvents;
}
