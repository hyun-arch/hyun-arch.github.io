// assets.js — 자료실("던지면 모이고 분류되고 요약되는 자산 공간")의 두뇌.
//   (1) 무엇을 던지든 종류(kind)·공간(space)·태그(tags)를 자동 추정하고
//   (2) 항상 localStorage 에 저장하며, Supabase(assets 테이블)가 있으면 함께 적재한다.
//   (3) 요약(summary/essence)은 비워둔 채 쌓고, '정제 패스'에서 채워 넣는다.
import { hasSupabase } from './config.js';
import { sbAssetList, sbAssetInsert, sbAssetUpdate, sbAssetDelete } from './backend.js';

const KEY = 'aramirror.assets.v1';
const MAX_LOCAL = 1000;

// ── 공간(Spaces) ──────────────────────────────────────────
export const SPACES = [
  { key: 'inbox',   name: '미분류',        icon: '🗂', color: '#8b8f98', desc: '방금 던진 것 · 자동 분류 대기' },
  { key: 'idea',    name: '영감',          icon: '💡', color: '#ffb457', desc: '아이디어 · 레퍼런스 · 무드' },
  { key: 'biz',     name: '비즈니스 · 전략', icon: '📈', color: '#ff7a4d', desc: '시장 · 경쟁사 · 트렌드' },
  { key: 'learn',   name: '학습 · 지식',    icon: '📚', color: '#a78bfa', desc: '강의 · 아티클 · 문서' },
  { key: 'project', name: '프로젝트 소재',  icon: '🛠', color: '#34d3c0', desc: '진행 중 프로젝트에 쓸 재료' },
  { key: 'later',   name: '나중에 볼 것',   icon: '⏳', color: '#7fd67a', desc: 'read / watch later' },
];
export const spaceOf = (key) => SPACES.find((s) => s.key === key) || SPACES[0];

// ── 자동 분류 휴리스틱 ─────────────────────────────────────
const IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i;
const URL_RE = /https?:\/\/[^\s]+/i;

// 도메인/키워드 → 공간 추정 규칙 (위에서부터 먼저 맞는 것)
const RULES = [
  { space: 'learn',   hosts: ['github.com', 'stackoverflow.com', 'developer.', 'docs.', 'arxiv.org', 'medium.com', 'velog.io', 'notion.so'], kw: ['논문', '강의', 'tutorial', 'docs', '문서', '정리'] },
  { space: 'biz',     hosts: ['bloomberg', 'reuters', 'wsj.com', 'hankyung', 'mk.co.kr', 'sedaily', 'linkedin.com', 'crunchbase'], kw: ['매출', '시장', '전략', '경쟁사', '투자', 'ir', '트렌드', '보고서'] },
  { space: 'later',   hosts: ['youtube.com', 'youtu.be', 'vimeo.com', 'netflix'], kw: ['나중에', 'later', '영상', '강연'] },
  { space: 'idea',    hosts: ['pinterest', 'behance', 'dribbble', 'instagram', 'unsplash'], kw: ['무드', '레퍼런스', '아이디어', '영감', '디자인'] },
];

function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return ''; } }
function ytId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// 자유 입력(raw = 붙여넣은 링크/메모, 선택적 note) → 자산 초안
export function classify(raw, opts = {}) {
  const text = String(raw || '').trim();
  const urlMatch = text.match(URL_RE);
  const url = opts.url || (urlMatch ? urlMatch[0] : '');
  const host = hostOf(url);
  const lower = (text + ' ' + host).toLowerCase();

  let kind = 'note', thumb = '', title = '';
  if (url) {
    const yid = ytId(url);
    if (yid) { kind = 'video'; thumb = `https://i.ytimg.com/vi/${yid}/hqdefault.jpg`; title = 'YouTube 영상'; }
    else if (host.includes('vimeo')) { kind = 'video'; title = 'Vimeo 영상'; }
    else if (IMG_RE.test(url) || opts.kind === 'image') { kind = 'image'; thumb = url; title = '이미지'; }
    else { kind = 'link'; title = host || '링크'; }
  } else if (text) {
    kind = 'note'; title = text.split('\n')[0].slice(0, 60);
  }

  // 공간 추정
  let space = 'inbox';
  for (const r of RULES) {
    if (r.hosts.some((h) => host.includes(h)) || r.kw.some((k) => lower.includes(k))) { space = r.space; break; }
  }
  if (space === 'inbox' && kind === 'note') space = 'idea'; // 순수 메모는 영감으로

  // 태그: 도메인 + 종류
  const tags = [];
  if (host) tags.push(host.split('.')[0]);
  tags.push(kind);

  return {
    kind, space, tags, url,
    thumb: opts.thumb || thumb,
    title: opts.title || title,
    note: opts.note || (url ? '' : text),
    raw: text,
  };
}

// ── 저장 (localStorage + Supabase) ────────────────────────
function localList() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { return []; } }
function localSave(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX_LOCAL))); } catch (_) {} }

// 로컬 우선으로 즉시 반환하고, Supabase가 있으면 병합.
export async function listAssets() {
  const local = localList();
  if (!hasSupabase()) return local;
  try {
    const remote = await sbAssetList();
    // id 기준 병합(원격 우선), 최신순
    const map = new Map();
    [...local, ...remote].forEach((a) => { if (a && a.id != null) map.set(String(a.id), a); });
    return Array.from(map.values()).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  } catch (_) { return local; }
}

export async function addAsset(draft) {
  const now = new Date().toISOString();
  const row = {
    id: 'a_' + now.replace(/\D/g, '') + '_' + Math.floor(performance.now()),
    kind: draft.kind, space: draft.space, tags: draft.tags || [],
    url: draft.url || '', thumb: draft.thumb || '', title: draft.title || '',
    note: draft.note || '', raw: draft.raw || '',
    summary: '', essence: '', status: 'pending', created_at: now,
  };
  const arr = localList(); arr.push(row); localSave(arr);
  if (hasSupabase()) {
    try { const saved = await sbAssetInsert(row); if (saved && saved.id) { row.id = saved.id; localSave(localList()); } }
    catch (e) { console.warn('[assets] Supabase 적재 실패, 로컬 보관:', String(e).slice(0, 100)); }
  }
  return row;
}

export async function updateAsset(id, patch) {
  const arr = localList();
  const i = arr.findIndex((a) => String(a.id) === String(id));
  if (i >= 0) { arr[i] = { ...arr[i], ...patch }; localSave(arr); }
  if (hasSupabase()) { try { await sbAssetUpdate(id, patch); } catch (_) {} }
  return i >= 0 ? arr[i] : null;
}

export async function removeAsset(id) {
  localSave(localList().filter((a) => String(a.id) !== String(id)));
  if (hasSupabase()) { try { await sbAssetDelete(id); } catch (_) {} }
}

// 유사 묶음: 같은 도메인 > 같은 종류로 클러스터
export function cluster(items) {
  const by = {};
  items.forEach((a) => {
    const host = hostOf(a.url);
    const key = host || a.kind || 'etc';
    (by[key] = by[key] || []).push(a);
  });
  return Object.entries(by)
    .map(([key, list]) => ({ key, list }))
    .sort((a, b) => b.list.length - a.list.length);
}
