// 캐러셀 스튜디오 — 콘텐츠 모델.
// "내가 이끌고, 클로드코드가 정리한다" → 여기 한 곳에 캐러셀 한 세트를 자료화.
// studio.astro 가 기획→슬라이드→캡션→마니챗→내보내기를 이 데이터로 그린다.
// slide/[n].astro 가 각 슬라이드를 인스타 사이즈(1080×1350)로 렌더 → PNG.

// ── 캐러셀 OS 기획 6가지 (참고: @zemma.selfishclub 케이스) ──
// 매번 같은 결의 캐러셀이 나오게 하는 뼈대. 안 잡으면 매번 다른 느낌 → 피그마 후작업.
export const osPillars = [
  { n: 1, name: '브랜드 디자인 시스템', detail: '색상·폰트·레이아웃', have: '다크 배경 + 포인트 노랑 #e9ed12, Pretendard + Spline Sans Mono', done: true,
    miss: '매번 다른 느낌의 캐러셀' },
  { n: 2, name: '슬라이드 구조', detail: '콘텐츠 유형별 슬라이드 틀', have: '표지 → 치트키 N장 → 요약 → CTA', done: true,
    miss: 'AI가 매번 다른 구조로 만듦' },
  { n: 3, name: '카피 톤앤매너', detail: '말투 가이드', have: '쉬운 우리말·짧은 문장·1인칭, 강조어만 노랑', done: true,
    miss: '“우리 콘텐츠 같지 않은” 결과물' },
  { n: 4, name: '입력 소스 · 데이터 흐름', detail: '무엇을 넣나', have: '텔레그램에 던진 생각 + 세션에서 배운 치트키', done: true,
    miss: '워크플로우 안 잡힘' },
  { n: 5, name: '출력 형식 · 편집 범위', detail: '어떻게 내보내나', have: '슬라이드별 1080×1350 PNG 자동 추출', done: true,
    miss: '결국 피그마로 후작업' },
  { n: 6, name: '캡션 · 해시태그 · 마니챗', detail: '발행 전략', have: '플랫폼별 캡션 + 댓글→DM 마니챗', done: true,
    miss: '캐러셀만 자동, 캡션은 수동' },
];

// ── 캐러셀 한 세트 ──
export const carousel = {
  id: 'claude-code-cheatkeys',
  topic: '클로드코드 치트키',
  audience: '비개발자 · AI로 일하고 싶은 사람 (스폰지클럽)',
  brand: 'Aramirror · 스킬러스',
  handle: '@aramirror',
  hook: '비개발자도 AI를 “잘” 쓰는 5가지 치트키',

  // 슬라이드 8장. theme: dark|light. label(모노 kicker) / title(코랄 강조는 <mark>) / sub / points
  slides: [
    { n: 1, theme: 'dark', kind: '표지',
      label: 'CLAUDE CODE · 치트키',
      title: 'AI를 <mark>“잘”</mark> 쓰는 법', titleSub: '비개발자를 위한 클로드코드 치트키 5',
      sub: '도구를 더하는 건 쉽다. “잘” 쓰는 건 다르다.',
      foot: '→ 넘겨보기' },

    { n: 2, theme: 'light', kind: '치트키',
      label: '치트키 ① · 쉽게 말하기',
      title: '<mark>“쉬운 말 써줘”</mark> + 시각화까지',
      sub: '모르는 건 모조리 묻기 — 눈높이를 낮춰달라고, 그림으로 보여달라고.',
      points: ['“쉽게 말해줘” 한마디면 눈높이가 내려온다', '“그림/화면으로 보여줘”로 시각화까지', '모르는 건 부끄러워 말고 다 묻기'] },

    { n: 3, theme: 'light', kind: '치트키',
      label: '치트키 ② · 인터뷰 해줘',
      title: '<mark>“인터뷰 해줘”</mark> : ask your question',
      sub: '막막할 땐 AI가 나를 인터뷰하게 — 질문에 답만 하면 정리된다.',
      points: ['“이 주제로 글 쓸 건데 뭘 알려주면 좋을까?”', 'AI가 방향 잡을 질문을 던진다', '답만 하면 내 생각이 구조가 된다'] },

    { n: 4, theme: 'dark', kind: '치트키',
      label: '치트키 ③ · 답변부터',
      title: '<mark>답변부터</mark> 하고 시작',
      sub: '침묵은 불안이다. 일을 시키면 “받았어” 먼저, 그다음 작업.',
      points: ['시키면 1초 안에 “받았어, 지금 할게”', '오래 걸리면 중간 경과도 바로바로', '조용한 구간을 만들지 않는다'] },

    { n: 5, theme: 'light', kind: '치트키',
      label: '치트키 ④ · 이끌고 정리하기',
      title: '내가 이끌고, <mark>AI가 정리</mark>한다',
      sub: '아이디어·방향은 나. 정리는 클로드코드가 MD 파일로 구조화.',
      points: ['나 = 아이디어 & 방향 제시', 'AI = 분석·기획·구조·체크리스트.md 로 정리', '말로 흩어지지 않고 문서 자산으로 남는다'] },

    { n: 6, theme: 'dark', kind: '치트키',
      label: '치트키 ⑤ · 보여줘',
      title: '말하지 말고 <mark>보여줘</mark>',
      sub: '결과는 글로 설명 말고 스샷·다이어그램으로 눈으로 확인.',
      points: ['“스샷 찍어서 보여줘”로 결과 검증', '“표/다이어그램으로 정리해줘”', '보이면 틀린 것도 바로 잡힌다'] },

    { n: 7, theme: 'light', kind: '요약',
      label: '한 장 요약',
      title: '치트키 <mark>5</mark>, 다시 보기',
      sub: '저장해두고 하나씩 써보세요.',
      points: ['① 쉬운 말 + 시각화', '② 인터뷰 해줘', '③ 답변부터 하고 시작', '④ 내가 이끌고, AI가 정리', '⑤ 말하지 말고 보여줘'] },

    { n: 8, theme: 'dark', kind: 'CTA',
      label: 'SAVE · FOLLOW',
      title: '오늘 <mark>하나만</mark> 써보기',
      sub: '이 카드를 저장하고, 딱 하나 골라 오늘 대화에 써보세요.',
      points: ['💬 댓글에 “치트키” → 전체 가이드 DM', '👤 팔로우하면 다음 편 놓치지 않아요'],
      foot: '@aramirror · Aramirror' },
  ],

  // ── 플랫폼별 캡션 (특성 맞게) ──
  captions: {
    instagram: {
      label: 'Instagram',
      note: '후킹 3줄 → 혜택 → 저장/댓글 CTA → 해시태그',
      body: `비개발자도 AI를 “잘” 쓰는 5가지 치트키 🧠

아직도 AI한테 뭉뚱그려 시키고 계신가요?
“잘” 쓰는 사람은 이 5개를 씁니다 👇

① “쉬운 말 써줘” + 그림으로 보여줘
② 막막하면 “인터뷰 해줘”
③ 시키면 “답변부터” 하게
④ 내가 이끌고, AI가 MD로 정리
⑤ 말하지 말고 “보여줘”(스샷·표)

저장해두고 오늘 딱 하나만 써보세요.
💬 댓글에 “치트키” 남기면 전체 가이드를 DM으로 보내드려요.
(팔로우 후 댓글이어야 DM 전달돼요 ⚠️)

#클로드코드 #ClaudeCode #AI업무 #AI활용 #생산성 #비개발자 #스폰지클럽 #업무자동화 #AI툴 #워크플로우`,
    },
    threads: {
      label: 'Threads',
      note: '짧고 대화체, 첫 줄로 낚고 스레드로 풀기',
      body: `AI한테 일 시킬 때 결과가 매번 다른 이유.

“잘” 쓰는 사람은 이걸 씁니다:

① “쉬운 말 써줘” + 시각화
② 막막하면 “인터뷰 해줘”
③ “답변부터” 하고 시작
④ 내가 이끌고, AI가 정리(.md)
⑤ 말 말고 “보여줘”

하나만 골라 오늘 써보세요.
어떤 게 제일 와닿아요? 👇`,
    },
    linkedin: {
      label: 'LinkedIn',
      note: '인사이트·전문 톤, 왜 중요한지 → 실전 5가지 → 마무리 질문',
      body: `“AI 도구를 도입했는데 왜 결과물 퀄리티가 들쑥날쑥할까?”

문제는 도구가 아니라 ‘쓰는 방식’입니다. 마케팅·실무를 직접 해 본 사람일수록, ‘어디에 AI를 써야 일이 바뀌는지’를 압니다.

현장에서 검증한 5가지 원칙:

1. 쉬운 말 + 시각화 — 눈높이를 낮추고 그림으로 확인
2. 인터뷰 요청 — 막막할 땐 AI가 질문하게 하고 답만 한다
3. 응답 우선 — 침묵을 만들지 않는 협업 리듬
4. 방향은 사람, 정리는 AI — 아이디어를 문서(.md)로 구조화
5. 결과의 시각적 검증 — 말이 아니라 스크린샷·표로 확인

핵심은 ‘자동화 속도’가 아니라 ‘아웃풋의 일관성’입니다.

여러분의 팀은 이 중 몇 가지를 이미 쓰고 계신가요?`,
    },
  },

  // ── 마니챗 (댓글 → DM 자동발송) ──
  manychat: {
    trigger: '치트키',
    note: '게시물 댓글에 트리거 키워드가 달리면 DM 자동 발송',
    messages: [
      { step: '1 · 오프닝', text: '안녕하세요! “클로드코드 치트키 5” 전체 가이드 보내드릴게요 🎁 잠깐만요...' },
      { step: '2 · 팔로우 확인', text: '자료는 팔로워분들께만 드리고 있어요. 팔로우 눌러주셨으면 아래 버튼을 눌러주세요 👇  [ 팔로우 완료 ✅ ]' },
      { step: '3 · 전달', text: '감사합니다! 여기 전체 가이드예요 → (링크)\n혹시 궁금한 치트키 있으면 이 DM으로 편하게 물어보세요 🙌' },
    ],
  },
};

// ── 레퍼런스 (캐러셀 만들 때 참고할 곳) ──
export const references = [
  { label: 'Behance — 카드뉴스/캐러셀 레퍼런스', desc: '디자인 사례 검색', url: 'https://www.behance.net/search/projects/%EC%B9%B4%EB%93%9C%EB%89%B4%EC%8A%A4?tracking_source=typeahead_search_direct' },
  { label: 'Snipit — 콘텐츠 레퍼런스', desc: 'ZEMMA 프로모로 가입 시 무료', url: 'http://reference.snipit.im/?promo=ZEMMA' },
  { label: 'awesome-claude-design (GitHub)', desc: '디자인 MD 모음', url: 'https://github.com/VoltAgent/awesome-claude-design' },
  { label: 'getdesign.md', desc: '디자인 MD 모음 사이트', url: 'https://getdesign.md/' },
  { label: 'Vercel', desc: '만든 서비스 배포', url: 'https://vercel.com/signup' },
];

export function slideByN(n) {
  return carousel.slides.find((s) => s.n === Number(n)) || null;
}
