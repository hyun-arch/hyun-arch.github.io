// 릴스 스튜디오 — 콘텐츠 모델.
// 캐러셀 스튜디오(carousel.js)의 영상 버전. "레퍼런스 하나 보여주면 → 똑같은 결로 기획·생산·제작·검수".
// reels.astro 가 레퍼런스 분석→기획→스토리보드→스크립트→프로덕션→검수→보관까지 이 데이터로 그린다.
// reels/frame/[n].astro 가 각 씬을 세로 릴스 사이즈(1080×1920)로 렌더 → 미리보기/캡처.

// ── 영상 OS 기획 6가지 ──
// 매번 같은 결의 릴스가 나오게 하는 뼈대. 캐러셀 OS의 "움직이는" 버전.
export const osPillars = [
  { n: 1, name: '브랜드 모션 시스템', detail: '색·폰트·전환', have: '다크 + 포인트 노랑 #e9ed12, Pretendard, 컷 사이 0.3s 크로스페이드', done: true,
    miss: '매번 다른 느낌의 영상' },
  { n: 2, name: '씬 구조 · 3막', detail: '훅 → 본문 → CTA', have: '0–3초 훅 → 치트키 N컷 → 요약 → 저장·팔로우 CTA', done: true,
    miss: 'AI가 매번 다른 구성으로 만듦' },
  { n: 3, name: '페이싱 · 리듬', detail: '컷 길이·박자', have: '컷당 2.5–4초, 훅은 1.5초, BGM 비트에 컷 맞춤', done: true,
    miss: '늘어지거나 정신없는 편집' },
  { n: 4, name: '자막 · 나레이션 톤', detail: '말투 가이드', have: '짧은 우리말·1인칭, 핵심어만 노랑 하이라이트, 자동캡션 켬', done: true,
    miss: '"우리 채널 같지 않은" 목소리' },
  { n: 5, name: '사운드', detail: 'BGM·SFX', have: '잔잔한 로파이 1곡 고정 + 컷 전환 SFX 1종', done: false,
    miss: '무음이라 몰입 안 됨 / 저작권 이슈' },
  { n: 6, name: '출력 · 렌더', detail: '어떻게 뽑나', have: '9:16 1080×1920, HyperFrames(HTML→영상)로 렌더 → mp4', done: true,
    miss: '결국 캡컷으로 수작업' },
];

// ── 릴스 한 세트 (데모: "클로드코드 치트키 5" 릴스 버전) ──
export const video = {
  id: 'claude-code-cheatkeys-reel',
  topic: '클로드코드 치트키 릴스',
  format: '9:16 릴스',
  duration: 30,               // 목표 길이(초)
  model: 'claude-code + hyperframes',
  audience: '비개발자 · AI로 일하고 싶은 사람 (스폰지클럽)',
  brand: 'Aramirror · 스킬러스',
  handle: '@aramirror',
  hook: 'AI한테 일 시키면 왜 결과가 매번 다를까?',
  bgm: '로파이 · 잔잔 (첫 비트에서 훅 자막 등장)',

  // ── 레퍼런스: "인터넷/SNS에서 보고 괜찮았던 영상"을 해부한 카드 ──
  // 여기 값을 채우면(또는 페이지에서 링크 넣고 분석하면) 같은 결로 기획된다.
  reference: {
    url: 'https://www.instagram.com/reel/EXAMPLE/',
    platform: 'instagram',
    title: '(예시) 5가지 AI 팁 릴스',
    // 해부 항목 — 이 6개만 뜯어보면 "왜 좋았는지"가 남는다.
    anatomy: {
      hook: '첫 1.5초에 큰 질문 자막 + 정지화면 → 궁금증',
      pacing: '컷당 2–3초, 팁 하나당 한 컷, 총 8컷',
      caption: '화면 중앙 큰 자막, 핵심어만 컬러, 자동캡션 하단',
      sound: '트렌디 로파이 비트, 컷이 비트에 맞아 떨어짐',
      cta: '"저장해두고 하나만 써봐" + 팔로우 유도',
      spec: '9:16 · 약 28초 · 자막 중심(무음 시청 대응)',
    },
  },

  // ── 스토리보드: 씬(컷) 단위 ──
  // theme: dark|light / kind: 훅|치트키|요약|CTA
  // onscreen(화면 큰 자막) / narration(보이스오버) / broll(비주얼 노트) / motion(모션 지시)
  scenes: [
    { n: 1, at: 0, dur: 3, theme: 'dark', kind: '훅',
      label: 'HOOK · 0–3s',
      title: 'AI한테 일 시키면<br><mark>결과가 매번 다른 이유</mark>',
      onscreen: '결과가 매번 다른 이유',
      narration: 'AI한테 똑같이 시켰는데 왜 결과가 매번 다를까요?',
      broll: '검은 배경, 커서 깜빡임 → 질문 자막이 타이핑되며 등장',
      motion: '자막 타이핑 인 + 마지막 단어 노랑 하이라이트 팝' },

    { n: 2, at: 3, dur: 4, theme: 'light', kind: '치트키',
      label: '치트키 ① · 3–7s',
      title: '<mark>“쉬운 말 써줘”</mark><br>+ 그림으로 보여줘',
      onscreen: '① 쉬운 말 + 시각화',
      narration: '첫째, 쉬운 말 써달라고 하고, 그림으로 보여달라고 하세요.',
      broll: '채팅 버블 "쉽게 말해줘" → 다이어그램으로 바뀜',
      motion: '버블 슬라이드 업, 다이어그램 스케일 인' },

    { n: 3, at: 7, dur: 4, theme: 'dark', kind: '치트키',
      label: '치트키 ② · 7–11s',
      title: '막막하면<br><mark>“인터뷰 해줘”</mark>',
      onscreen: '② 인터뷰 해줘',
      narration: '둘째, 막막할 땐 AI가 나를 인터뷰하게 하고 답만 하세요.',
      broll: '물음표들이 떠오르고 하나씩 체크로 바뀜',
      motion: '물음표 플로트 인, 체크 스탬프' },

    { n: 4, at: 11, dur: 4, theme: 'light', kind: '치트키',
      label: '치트키 ③ · 11–15s',
      title: '<mark>답변부터</mark><br>하고 시작',
      onscreen: '③ 답변부터',
      narration: '셋째, 시키면 "받았어" 먼저, 그다음 작업하게 하세요.',
      broll: '"받았어 ✓" 말풍선이 먼저, 뒤에 진행바',
      motion: '말풍선 팝 + 진행바 채워짐' },

    { n: 5, at: 15, dur: 4, theme: 'dark', kind: '치트키',
      label: '치트키 ④ · 15–19s',
      title: '내가 이끌고<br><mark>AI가 정리</mark>한다',
      onscreen: '④ 이끌고 · 정리',
      narration: '넷째, 방향은 내가, 정리는 AI가 문서로 남기게 하세요.',
      broll: '손 아이콘이 방향 화살표 → .md 파일 카드로 정리',
      motion: '화살표 드로우, md 카드 스택 인' },

    { n: 6, at: 19, dur: 4, theme: 'light', kind: '치트키',
      label: '치트키 ⑤ · 19–23s',
      title: '말하지 말고<br><mark>보여줘</mark>',
      onscreen: '⑤ 보여줘',
      narration: '다섯째, 결과는 말 말고 스샷·표로 눈으로 확인하세요.',
      broll: '텍스트 벽 → 스크린샷/표로 전환',
      motion: '텍스트 페이드 아웃, 스샷 프레임 인' },

    { n: 7, at: 23, dur: 4, theme: 'dark', kind: '요약',
      label: '요약 · 23–27s',
      title: '치트키 <mark>5</mark>, 한 번에',
      onscreen: '① 쉬운말 ② 인터뷰 ③ 답변부터 ④ 이끌고정리 ⑤ 보여줘',
      narration: '다섯 개, 저장해두고 하나씩 써보세요.',
      broll: '5개 항목이 리스트로 착착 쌓임',
      motion: '리스트 스태거 인(0.1s 간격)' },

    { n: 8, at: 27, dur: 3, theme: 'dark', kind: 'CTA',
      label: 'CTA · 27–30s',
      title: '오늘 <mark>하나만</mark><br>써보기',
      onscreen: '저장 · 팔로우',
      narration: '이 영상 저장하고, 딱 하나 골라 오늘 써보세요. 팔로우도요.',
      broll: '저장 아이콘 + 팔로우 버튼 펄스',
      motion: '아이콘 바운스, 핸들 페이드 인',
      foot: '@aramirror · Aramirror' },
  ],

  // ── 스크립트 (보이스오버 전체 · 복사용) ──
  script: `AI한테 똑같이 시켰는데 왜 결과가 매번 다를까요?
잘 쓰는 사람은 이 다섯 개를 씁니다.
하나, 쉬운 말 써달라 하고 그림으로 보여달라 하세요.
둘, 막막하면 AI가 나를 인터뷰하게 하고 답만 하세요.
셋, 시키면 "받았어" 먼저, 그다음 작업하게 하세요.
넷, 방향은 내가, 정리는 AI가 문서로 남기게 하세요.
다섯, 결과는 말 말고 스샷과 표로 확인하세요.
저장해두고 오늘 딱 하나만 써보세요. 팔로우도 잊지 마세요.`,

  // ── 플랫폼별 캡션 ──
  captions: {
    instagram: {
      label: 'Instagram Reels',
      note: '첫 줄 후킹 → 5줄 요약 → 저장/댓글 CTA → 해시태그',
      body: `AI한테 일 시키면 결과가 매번 다른 이유 🧠

잘 쓰는 사람은 이 5개를 씁니다 👇
① 쉬운 말 + 그림으로 보여줘
② 막막하면 "인터뷰 해줘"
③ "답변부터" 하고 시작
④ 내가 이끌고, AI가 정리(.md)
⑤ 말하지 말고 "보여줘"(스샷·표)

저장하고 오늘 딱 하나만 써보세요.
💬 댓글 "치트키" → 전체 가이드 DM (팔로우 후 댓글이어야 전달돼요 ⚠️)

#클로드코드 #ClaudeCode #AI활용 #릴스 #숏폼 #생산성 #비개발자 #스폰지클럽`,
    },
    youtube: {
      label: 'YouTube Shorts',
      note: '검색 잘 걸리게 키워드 앞으로, 짧게',
      body: `비개발자가 AI 잘 쓰는 5가지 치트키 #shorts

① 쉬운 말 + 시각화 ② 인터뷰 해줘 ③ 답변부터 ④ 이끌고 정리 ⑤ 보여줘

저장해두고 하나씩 써보세요.
#클로드코드 #AI #숏폼 #생산성`,
    },
    tiktok: {
      label: 'TikTok',
      note: '트렌디·대화체, 첫 줄로 낚기',
      body: `AI 결과가 매번 다른 사람 특징 👀

이 5개 모르는 거임:
① 쉬운 말+그림 ② 인터뷰 해줘 ③ 답변부터 ④ 이끌고 정리 ⑤ 보여줘

저장 ㄱㄱ, 하나만 써봐
#클로드코드 #AI #숏폼 #꿀팁`,
    },
  },

  // ── 검수(QC) 체크리스트 — "제작 검수까지" ──
  qc: [
    { k: 'hook', label: '훅이 3초 안에 걸리나 (첫 자막이 궁금증을 만드나)' },
    { k: 'silent', label: '무음으로 봐도 이해되나 (자막만으로 전달)' },
    { k: 'caption', label: '자막 가독성 — 글자 크기·대비·안전영역(상하 15%) 벗어남 없음' },
    { k: 'brand', label: '브랜드 컬러 #e9ed12 · 폰트 고정, 매 컷 톤 일관' },
    { k: 'pacing', label: '컷당 2.5–4초, 늘어지는 구간 없음' },
    { k: 'length', label: '전체 길이 30초 이하, 릴스 9:16 비율' },
    { k: 'sound', label: 'BGM 저작권 안전 + 컷이 비트에 맞음' },
    { k: 'cta', label: 'CTA(저장·팔로우·댓글) 명확' },
    { k: 'typo', label: '자막·자동캡션 오탈자 없음' },
  ],

  // ── 마니챗 (댓글 → DM) ──
  manychat: {
    trigger: '치트키',
    note: '릴스 댓글에 트리거가 달리면 DM 자동 발송',
    messages: [
      { step: '1 · 오프닝', text: '안녕하세요! "클로드코드 치트키 5" 가이드 보내드릴게요 🎁 잠깐만요...' },
      { step: '2 · 팔로우 확인', text: '자료는 팔로워분들께만 드려요. 팔로우 눌렀으면 아래를 눌러주세요 👇  [ 팔로우 완료 ✅ ]' },
      { step: '3 · 전달', text: '감사합니다! 여기 전체 가이드예요 → (링크)\n궁금한 치트키 있으면 이 DM으로 편하게 물어보세요 🙌' },
    ],
  },
};

// ── 레퍼런스 (영상 만들 때 참고할 곳) ──
export const references = [
  { label: 'Pinterest — 릴스/숏폼 레퍼런스', desc: '무드·자막 스타일 수집', url: 'https://www.pinterest.com/search/pins/?q=reels%20design' },
  { label: 'TikTok Creative Center', desc: '트렌드 사운드·영상 분석', url: 'https://ads.tiktok.com/business/creativecenter/' },
  { label: 'Motionleap / CapCut 템플릿', desc: '전환·자막 템플릿', url: 'https://www.capcut.com/templates' },
  { label: 'Coverr · Pexels Video', desc: '무료 b-roll 영상', url: 'https://www.pexels.com/videos/' },
  { label: 'HyperFrames (HTML→영상)', desc: '이 스튜디오가 쓰는 렌더 엔진', url: 'https://github.com/' },
];

// 레퍼런스 링크 → 플랫폼 감지 (클라이언트에서도 씀).
export function detectPlatform(url) {
  const u = (url || '').toLowerCase();
  if (/instagram\.com/.test(u)) return 'instagram';
  if (/tiktok\.com/.test(u)) return 'tiktok';
  if (/(youtube\.com\/shorts|youtu\.be|youtube\.com)/.test(u)) return 'youtube';
  if (/x\.com|twitter\.com/.test(u)) return 'x';
  if (/facebook\.com|fb\.watch/.test(u)) return 'facebook';
  return url ? 'link' : '';
}

export function sceneByN(n) {
  return video.scenes.find((s) => s.n === Number(n)) || null;
}
