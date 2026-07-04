// Aramirror — 클라이언트 데이터 레이어 (localStorage 기반)
// 정적 사이트(GitHub Pages)에서도 실제로 동작하는 게시판/페이지 관리 스토어.
// 게시판 글 = CRUD 대상, 웹페이지 = 상위 노출/숨김 관리 대상.
// 데이터는 브라우저 localStorage에 저장되며 JSON 내보내기/가져오기로 영속화한다.

const POSTS_KEY = 'aramirror.board.v1';
const PAGES_KEY = 'aramirror.pages.v1';

// ── 카테고리 (게시판 상위 분류) ──────────────────────────────
export const CATEGORIES = ['생각', '빌드로그', '글', '공유회', '공지'];

// ── 게시판 초기 시드 (첫 방문 시 1회 주입) ────────────────────
const SEED_POSTS = [
  {
    id: 'seed-genesis',
    title: 'Genesis — 텔레그램 한 줄에서 시작된 OS',
    category: '빌드로그',
    tags: ['Aramirror', 'OS', 'Telegram'],
    body: '메모앱이 아니라 "내 생각이 값(자산)이 되는 환경"을 만들었다. 텔레그램으로 던지면 저널에 누적되고, 밤마다 위키로 승격되고, 아라미러로 발행된다.',
    status: 'published',
    date: '2026-06-29',
    updated: '2026-06-29',
  },
  {
    id: 'seed-flow',
    title: 'Flow — 몰입, 그리고 알을 깨는 새',
    category: '빌드로그',
    tags: ['Flow', '몰입'],
    body: '시간을 한 방울씩. 몰입 타이머와 몰입 기록으로 집중의 리듬을 자산으로 남긴다.',
    status: 'published',
    date: '2026-07-03',
    updated: '2026-07-03',
  },
  {
    id: 'seed-share-0704',
    title: '0704 에이든의 이기적스폰지 공유회 — 초중급 정리',
    category: '공유회',
    tags: ['ClaudeCode', '스킬', '서브에이전트', 'CRUD', 'KEY연결'],
    body:
      '아젠다 5: ① 기본스킬 ② KEY 연결 → CRUD 게시판 ③ 딥인터뷰+기본스킬 ④ 씽킹노트 ⑤ 서브에이전트와 동적 워크플로우.\n\n' +
      '· KEY 연결: 연결 방법은 매일 바뀌니 "API/MCP/CLI 되는 X → 증강·자동화" 공식만 익힌다. .env 하나에서 GitHub·Supabase·Vercel로 배선 — 한 번이 힘들지 그다음은 쭉 편해진다.\n' +
      '· 재활용 = 자동화의 핵심 = 스킬. 스킬과 서브에이전트는 본질적으로 같다(세션을 새로 키우냐 아니냐).\n' +
      '· 디자인: Ant Design 컴포넌트로 "언어"를 늘리고, 잘 만든 걸 레퍼런스로 카피하며 배운다. 구현 비용은 0에 수렴, 진입장벽이 더 중요해졌다.\n' +
      '· AI 시대의 주인공은 마크다운(노션 X) — 렌더링 없이도 구조가 산다.\n' +
      '· 씽킹노트 = 탐욕적으로 공부하기: 주제→하위주제 팬아웃→탐색·선별·번역→essence로 응축(insane-search).\n' +
      '· 서브에이전트: 32개 프로젝트·80개 마크다운을 병렬로 MECE 정리. 하나의 주제를 보고서 10개로 팬아웃(동적 워크플로우).\n' +
      '· 실습 산출물: 어드민 게시판(BASEBOARD, Vercel+Supabase) — 대시보드·게시글·상태(공개)·처리(숨김/삭제).\n' +
      '· oh-my-claudecode: github.com/Yeachan-Heo/oh-my-claudecode',
    status: 'published',
    date: '2026-07-04',
    updated: '2026-07-04',
  },
];

// ── 웹페이지 상위 관리 레지스트리 (사이트 실제 라우트) ─────────
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

function read(key, fallback) {
  if (!isBrowser) return structuredClone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function write(key, value) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('aramirror:store', { detail: { key } }));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return 'p-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

// ── 게시판 글 CRUD ───────────────────────────────────────────
export function getPosts() {
  const data = read(POSTS_KEY, null);
  if (data === null) {
    write(POSTS_KEY, SEED_POSTS);
    return structuredClone(SEED_POSTS);
  }
  return data;
}

export function getPost(id) {
  return getPosts().find((p) => p.id === id) || null;
}

export function createPost(input) {
  const posts = getPosts();
  const post = {
    id: uid(),
    title: (input.title || '무제').trim(),
    category: input.category || '생각',
    tags: normalizeTags(input.tags),
    body: input.body || '',
    status: input.status === 'draft' ? 'draft' : 'published',
    date: input.date || today(),
    updated: today(),
  };
  posts.unshift(post);
  write(POSTS_KEY, posts);
  return post;
}

export function updatePost(id, patch) {
  const posts = getPosts();
  const i = posts.findIndex((p) => p.id === id);
  if (i === -1) return null;
  posts[i] = {
    ...posts[i],
    ...patch,
    tags: patch.tags !== undefined ? normalizeTags(patch.tags) : posts[i].tags,
    updated: today(),
  };
  write(POSTS_KEY, posts);
  return posts[i];
}

export function deletePost(id) {
  const posts = getPosts().filter((p) => p.id !== id);
  write(POSTS_KEY, posts);
}

export function togglePublish(id) {
  const p = getPost(id);
  if (!p) return null;
  return updatePost(id, { status: p.status === 'published' ? 'draft' : 'published' });
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── 웹페이지 상위 관리 ────────────────────────────────────────
export function getPages() {
  const data = read(PAGES_KEY, null);
  if (data === null) {
    write(PAGES_KEY, SEED_PAGES);
    return structuredClone(SEED_PAGES);
  }
  return data;
}

export function togglePageVisibility(path) {
  const pages = getPages();
  const i = pages.findIndex((p) => p.path === path);
  if (i === -1) return;
  pages[i].visible = !pages[i].visible;
  write(PAGES_KEY, pages);
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

// ── 내보내기 / 가져오기 (JSON 영속화) ─────────────────────────
export function exportAll() {
  return JSON.stringify({ version: 1, posts: getPosts(), pages: getPages() }, null, 2);
}

export function importAll(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (Array.isArray(data.posts)) write(POSTS_KEY, data.posts);
  if (Array.isArray(data.pages)) write(PAGES_KEY, data.pages);
  return stats();
}

export function resetAll() {
  write(POSTS_KEY, SEED_POSTS);
  write(PAGES_KEY, SEED_PAGES);
}

// ── 변경 구독 ────────────────────────────────────────────────
export function onChange(handler) {
  if (!isBrowser) return () => {};
  const fn = () => handler();
  window.addEventListener('aramirror:store', fn);
  window.addEventListener('storage', fn); // 다른 탭 동기화
  return () => {
    window.removeEventListener('aramirror:store', fn);
    window.removeEventListener('storage', fn);
  };
}
