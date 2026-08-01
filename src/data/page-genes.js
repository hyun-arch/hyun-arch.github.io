// ─────────────────────────────────────────────────────────────
// 페이지 × 유전자 지도
//
// 아라미러의 모든 화면에 "이 페이지는 누구에게서 무엇을 물려받았나"를 명시한다.
// 크루 147명의 코어를 한 군데 몰아넣지 않고 전 페이지에 나눠 심기 위한 표.
//
// 각 항목: genes(유전자 id) · from(출처 크루) · did(이 페이지에 실제로 반영한 것)
//         cap(이 페이지에서 던질 때 자동으로 붙는 태그) · capHint(입력창 안내)
// ─────────────────────────────────────────────────────────────

export const pageGenes = {
  '/': {
    genes: ['friction', 'promote', 'loop', 'world'],
    from: '띵크 · 흐민 · 다니 · 채리 · 하니',
    did: '한 줄 입력을 화면 주인공으로 두고, 레벨·미션·파이프라인을 한 화면에 응축했다.',
    cap: '생각', capHint: '지금 떠오른 것 아무거나',
  },
  '/inbox': {
    genes: ['promote', 'orchest', 'evidence', 'socratic', 'honest'],
    from: '흐민 · 딜런 · 세계로 · 모닥 · 르니 · 웃는돌',
    did: '승격 4단계·자동 분류·근거 3상태·결정 카드·정직 로그를 한 화면에 모았다.',
    cap: '인박스', capHint: '분류는 알아서 됩니다',
  },
  '/wall': {
    genes: ['evidence', 'promote', 'honest'],
    from: '모닥 · 애월 · 박미수 · 써니',
    did: '내 생각과 외부 자료를 물리적으로 갈라놓고, 외부에는 출처와 확인 여부를 강제한다.',
    cap: '생각', capHint: '내 것으로 남길 생각',
  },
  '/shelf': {
    genes: ['orchest', 'friction', 'format'],
    from: '세계로 · 치코 · 린디 · 포비',
    did: '"어디에 넣지"를 없앴다. 던지면 규칙이 분류하고, 왜 그렇게 갔는지까지 보여준다.',
    cap: '책장', capHint: '어디에 넣을지 고민하지 마세요',
  },
  '/archive': {
    genes: ['evidence', 'promote'],
    from: '모닥 · 애월 · 지수 · 써니 · 달빛그린',
    did: '자료는 기본이 "미확인". 확인한 것만 근거로 쓰이고, 안 꺼내 쓴 자료가 드러난다.',
    cap: '자료', capHint: '링크를 붙이면 자료로 들어갑니다',
  },
  '/ask': {
    genes: ['socratic', 'harness'],
    from: '르니 · 위버 · 설록 · 콩 · 박라엘',
    did: '답을 주지 않고 되묻는다. 끝에는 결정·기준·리스크·첫걸음 네 칸이 남는다.',
    cap: '질문', capHint: '지금 걸리는 고민 한 줄',
  },
  '/publish': {
    genes: ['evidence', 'honest', 'format'],
    from: '양세 · 최강훈 · 필리줄리 · 포비 · 이든',
    did: '내보내기 전에 가상 독자로 한 번 거르고, 신뢰 신호가 붙었는지 점검한다.',
    cap: '발행', capHint: '발행하고 싶은 것',
  },
  '/how': {
    genes: ['harness', 'orchest', 'boundary'],
    from: 'J · 써니 · 아벨 · 털보 · Galia',
    did: '이 시스템이 어떻게 도는지를 12 유전자 기준으로 다시 썼다.',
    cap: '작동', capHint: '고치고 싶은 흐름',
  },
  '/flow': {
    genes: ['loop', 'world'],
    from: '아가타 · 다니 · 채리 · 골프청년',
    did: '몰입을 성과가 아니라 상태로 본다. 컨디션이 오늘의 최적값을 정한다.',
    cap: '몰입', capHint: '지금 집중하려는 것',
  },
  '/os': {
    genes: ['evidence', 'harness', 'loop'],
    from: '미미 · 리사 · 비키 · 베리 · 로밍',
    did: '숫자를 총액이 아니라 밀도로 보고, 판정에는 항상 다음 길을 남긴다.',
    cap: '경영', capHint: '흑자전환 관련 생각',
  },
  '/vault': {
    genes: ['boundary', 'evidence'],
    from: 'Galia · 챈 · 리사 · 케이 · 개미',
    did: '재무는 배포에서 아예 제외한다. 잔액이 아니라 여유자금을 먼저 보여준다.',
    cap: '금고', capHint: '이 브라우저에만 남습니다',
  },
  '/board': {
    genes: ['promote', 'scale'],
    from: '제제 · 개미 · 비비안',
    did: '인박스에서 자산까지 올라간 것만 여기로 나온다. 게시판은 승격의 출구다.',
    cap: '글', capHint: '게시판에 올릴 것',
  },
  '/writings': {
    genes: ['promote', 'format'],
    from: '잭 · 제인 · 배짱',
    did: '글은 갑자기 나오지 않는다. 승격된 생각이 쌓여 한 편이 된다.',
    cap: '글', capHint: '글감',
  },
  '/reading': {
    genes: ['promote', 'evidence'],
    from: '코니 · 거북이의꿈 · 써니',
    did: '읽은 것을 요약이 아니라 "나에게 무슨 뜻인가"로 남긴다.',
    cap: '독서', capHint: '읽다 걸린 문장',
  },
  '/build-logs': {
    genes: ['honest', 'harness'],
    from: '제인 · 헤이즐 · 이든 · 웃는돌',
    did: '신호·판단·실행·증명·배움 다섯 조각으로 남긴다. 안 한 건 안 했다고 쓴다.',
    cap: '빌드로그', capHint: '오늘 만든 것 · 막힌 것',
  },
  '/arambot': {
    genes: ['evidence', 'socratic'],
    from: '애월 · 지수 · 미미 · 위버',
    did: '답에 커버리지를 붙인다. 몇 개 중 몇 개를 어떤 기준으로 봤는지.',
    cap: '아람봇', capHint: '봇에게 물을 것',
  },
  '/calendar': {
    genes: ['friction', 'loop'],
    from: '띵크 · 스테파노 · 피노 · 로밍',
    did: '로그인 없이 켜면 오늘이 다 보인다. 마감은 시스템이 먼저 알려준다.',
    cap: '일정', capHint: '날짜·시간을 쓰면 일정이 됩니다',
  },
  '/masters': {
    genes: ['socratic', 'world'],
    from: '설록 · 위버 · 최진석 · 고명환',
    did: '답을 주는 스승이 아니라 되묻는 스승을 옆에 둔다.',
    cap: '스승', capHint: '스승에게 물을 것',
  },
  '/studio': {
    genes: ['format', 'orchest'],
    from: '솔라 · 포비 · 키노 · 다니 · 모닥',
    did: '디자인 결정을 매번 다시 하지 않는다. 고정 틀 + 변수 슬롯.',
    cap: '스튜디오', capHint: '만들고 싶은 콘텐츠',
  },
  '/reels': {
    genes: ['format', 'evidence'],
    from: '양세 · 털보 · 이안 · 키노',
    did: '설계(콘티) 먼저. 발행 전 가상 시청자로 한 번 거른다.',
    cap: '릴스', capHint: '영상 아이디어',
  },
  '/shell-studio': {
    genes: ['scale', 'loop'],
    from: '비비안 · 아람 · Galia',
    did: '보이지 않는 자원(셸)에 값을 매겨 공정하게 자동 분배한다.',
    cap: '셸', capHint: '셸 관련',
  },
  '/studio-team': {
    genes: ['orchest', 'harness'],
    from: '흐민 · 지니 · 단수 · 에밀리',
    did: '메인이 서브를 고용하듯 역할을 쪼갠다. 부서별 R&R을 문서로 못박는다.',
    cap: '스튜디오팀', capHint: '팀 구조에 대한 생각',
  },
  '/gtb': {
    genes: ['loop', 'world', 'scale'],
    from: '아이리스 · 개미 · 치코',
    did: '모임은 운영자가 챙기는 게 아니라 시스템이 굴린다. 재방문 고리를 만든다.',
    cap: 'GTB', capHint: '농구클럽 관련',
  },
  '/spongeclub': {
    genes: ['promote', 'honest'],
    from: '스폰지클럽 2기 71명',
    did: '71명의 1주차 기획을 그대로 남긴다. 미제출도 지우지 않는다.',
    cap: '스폰지', capHint: '스폰지클럽 관련',
  },
  '/mission-rank': {
    genes: ['evidence', 'honest'],
    from: '스폰지클럽 2기 전수 심사',
    did: '점수만이 아니라 왜 그 점수인지, 그리고 남은 프런티어까지 정직하게 쓴다.',
    cap: '랭킹', capHint: '과제·랭킹 관련',
  },
  '/dna': {
    genes: ['promote', 'evidence', 'honest'],
    from: '스폰지클럽 1·2기 147명',
    did: '147명의 코어가 어느 부품이 됐는지, 그게 작동 중인지까지 있는 그대로 편다.',
    cap: 'DNA', capHint: '크루에게서 배운 것',
  },
  '/robil': {
    genes: ['evidence', 'scale'],
    from: '리사 · 에밀리아',
    did: '내 몸의 진짜 맥락에 맞춘 코칭. 데이터는 내 브라우저 안에만.',
    cap: '로빌', capHint: '건강·기록 관련',
  },
  '/sponge': { genes: ['loop', 'world'], from: '치코 · 다니', did: '시간이 흐르는 걸 눈으로 보게 한다.', cap: '시계', capHint: '' },
  '/world': { genes: ['friction'], from: '유스 · 히얌', did: '여러 도시 시간을 한 화면에서 한 번에.', cap: '시계', capHint: '' },
  '/admin': { genes: ['boundary', 'harness'], from: '개미 · Galia · 챈', did: '정책은 추가가 아니라 교체. 비번은 코드가 아니라 환경변수에.', cap: '관리', capHint: '' },
};

export function forPath(path) {
  const p = (path || '/').replace(/\/+$/, '') || '/';
  return pageGenes[p] || null;
}
