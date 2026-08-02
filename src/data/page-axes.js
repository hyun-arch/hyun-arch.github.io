// ─────────────────────────────────────────────────────────────
// 페이지별 캡처 태그
// 각 화면에서 한 줄 던질 때 자동으로 붙는 태그와 안내 문구.
// ─────────────────────────────────────────────────────────────

export const pageCapture = {
  '/': { tag: '생각', hint: '지금 떠오른 것 아무거나' },
  '/core': { tag: '코어', hint: '지금 걸린 것 한 줄 — 답이 아니라 질문이 나를 깊게 만든다' },
  '/inbox': { tag: '인박스', hint: '분류는 알아서 됩니다' },
  '/wall': { tag: '생각', hint: '내 것으로 남길 생각' },
  '/shelf': { tag: '책장', hint: '어디에 넣을지 고민하지 마세요' },
  '/archive': { tag: '자료', hint: '링크를 붙이면 자료로 들어갑니다' },
  '/ask': { tag: '질문', hint: '지금 걸리는 고민 한 줄' },
  '/publish': { tag: '발행', hint: '발행하고 싶은 것' },
  '/how': { tag: '작동', hint: '고치고 싶은 흐름' },
  '/flow': { tag: '몰입', hint: '지금 집중하려는 것' },
  '/os': { tag: '경영', hint: '흑자전환 관련 생각' },
  '/vault': { tag: '금고', hint: '이 브라우저에만 남습니다' },
  '/board': { tag: '글', hint: '게시판에 올릴 것' },
  '/writings': { tag: '글', hint: '글감' },
  '/reading': { tag: '독서', hint: '읽다 걸린 문장' },
  '/build-logs': { tag: '빌드로그', hint: '오늘 만든 것 · 막힌 것' },
  '/arambot': { tag: '아람봇', hint: '봇에게 물을 것' },
  '/calendar': { tag: '일정', hint: '날짜·시간을 쓰면 일정이 됩니다' },
  '/masters': { tag: '스승', hint: '스승에게 물을 것' },
  '/studio': { tag: '스튜디오', hint: '만들고 싶은 콘텐츠' },
  '/reels': { tag: '릴스', hint: '영상 아이디어' },
  '/shell-studio': { tag: '셸', hint: '셸 관련' },
  '/studio-team': { tag: '스튜디오팀', hint: '팀 구조에 대한 생각' },
  '/gtb': { tag: 'GTB', hint: '농구클럽 관련' },
  '/sponge': { tag: '시계', hint: '' },
  '/world': { tag: '시계', hint: '' },
  '/admin': { tag: '관리', hint: '' },
};

export function forPath(path) {
  const p = (path || '/').replace(/\/+$/, '') || '/';
  return pageCapture[p] || null;
}
