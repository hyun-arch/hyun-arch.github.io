// 개발일지(Build Logs) — 단일 소스.
// 홈(index.astro)과 목록(build-logs/index.astro)이 이 배열 하나를 공유한다.
// 새 로그를 추가하면 두 곳에 동시 반영된다. (최신이 위)
export const logs = [
  { id: '#04', title: '게시판을 실서버로 — localStorage에서 Supabase로 승격하다', date: '2026-07-07', href: '/build-logs/04-supabase-crud' },
  { id: '#03', title: '게시판과 관리자 — KEY 연결 없이 CRUD를 세우다',            date: '2026-07-04', href: '/build-logs/03-board-admin' },
  { id: '#02', title: 'Flow — 몰입, 그리고 알을 깨는 새',                        date: '2026-07-03', href: '/build-logs/02-flow' },
  { id: '#01', title: 'Genesis — 텔레그램 한 줄에서 시작된 OS',                  date: '2026-06-29', href: '/build-logs/01-genesis' },
];
