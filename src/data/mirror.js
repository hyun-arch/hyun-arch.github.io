// 아라미러 전체 지도의 단일 콘텐츠 모델.
// 여기 한 곳에 모든 항목을 "자료화"해두면 →
//  - mirror.astro 가 이 데이터로 지도를 그리고
//  - /m/[slug] 이 항목마다 상세 페이지를 자동으로 만든다.
//
// 항목(item) 스키마:
//   t      : 화면에 보이는 이름 (필수)
//   slug   : 상세 페이지 주소 조각 (to 가 없으면 필수, /m/<slug> 로 열림)
//   to     : 이미 있는 기능 페이지로 바로 보낼 때 (예: '/flow'). 있으면 상세 페이지 대신 그리로.
//   status : 'live'(작동 중) | 'building'(만드는 중) | 'seed'(내용 채움) | 'idea'(아이디어)
//   lead   : 상세 페이지 첫 줄 요약
//   points : 상세 페이지 불릿 목록
//   links  : [{label, href, external?}] 관련 이동

const S = {
  live: { label: '작동 중', cls: 'live' },
  building: { label: '만드는 중', cls: 'building' },
  seed: { label: '내용 있음', cls: 'seed' },
  idea: { label: '아이디어', cls: 'idea' },
};

export const domains = [
  {
    icon: '🧍', key: '01', title: '개인', en: 'Personal', color: '#ff7a4d',
    tagline: '나를 나이게 하는 것들',
    branches: [
      {
        h: '몰입 · 사색',
        items: [
          { t: '플로우 타이머', to: '/flow', status: 'live' },
          { t: '리버스 저널링', slug: 'reverse-journal', status: 'building', from: '지수 · 미미',
            lead: '저녁 캡처가 비어 있으면, 봇이 먼저 질문을 던져 한 줄이라도 끌어낸다. 모으는 게 아니라 끌어내 주기.',
            points: ['조용한 날엔 8가지 결 랜덤 질문을 먼저 발송', '“오래 조용하면 먼저 말 걸기” 능동형 체크인', '한 줄이라도 남으면 사색 노트로 연결'],
            links: [{ label: '사색 노트', href: '/m/saek-note' }] },
          {
            t: '사색 노트 — 데미안 · 몰입', slug: 'saek-note', status: 'seed',
            lead: '읽으며 밑줄 친 문장을 내 삶에 갖다 붙이는 곳. 요약이 아니라 “나에게 무슨 뜻인가”를 적는다.',
            points: [
              '데미안 — “새는 알에서 나오려고 투쟁한다. 알은 세계다.” 지금 내가 깨고 나오는 알은 무엇인가.',
              '몰입(황농문) — 생각의 밀도를 끝까지 끌어올리는 상태. 하루 한 번은 이 상태에 들어가기.',
              '사색은 입력이 아니라 소화 — 읽은 것을 내 언어로 다시 쓸 때 비로소 내 것이 된다.',
            ],
            links: [{ label: '몰입 타이머로', href: '/flow' }, { label: '#02 몰입 글', href: '/build-logs/02-flow' }],
          },
          {
            t: '오늘의 한 문장', slug: 'one-line-today', status: 'building',
            lead: '하루를 한 문장으로 남긴다. 길게 쓰면 안 쓰게 되니까, 딱 한 줄.',
            points: [
              '텔레그램에 한 줄 던지면 이 칸에 쌓이도록 (마찰 0 입력).',
              '밤마다 그날의 한 문장을 모아 되돌아보기로 연결.',
            ],
          },
        ],
      },
      {
        h: '건강 · 컨디션',
        items: [
          { t: '수면 기록', slug: 'sleep', status: 'idea', lead: '몇 시에 자고 일어났는지, 그날 몰입과 어떻게 연결되는지 본다.',
            points: ['잘 잔 날 vs 못 잔 날의 몰입 시간 비교', '자기 전 화면 시간 줄이기 실험'] },
          { t: '위통증 · 감정 체크인', slug: 'gut-emotion', status: 'seed',
            lead: '위가 아플 때가 있다. 몸의 신호와 그날의 감정·스트레스를 같이 기록해 패턴을 찾는다.',
            points: ['통증 0~5 단계로 간단히', '무엇을 먹었는지·어떤 일이 있었는지 한 줄', '반복되면 병원 갈 근거 자료가 됨'] },
          { t: '아침저녁 컨디션', slug: 'condition', status: 'idea', lead: '아침·저녁 컨디션을 이모지 하나로. 흐름만 보여도 충분하다.',
            points: ['😀 🙂 😐 😔 😩 중 하나', '주간으로 모아 리듬 확인'] },
        ],
      },
      {
        h: '습관 · 목표',
        items: [
          { t: '아침 리포트 (결론형)', slug: 'morning-report', status: 'building', from: '헤이 · 웃는돌',
            lead: '정보를 나열하지 않고 결론부터. “제목 한 줄 + 핵심 3점 + So what” 형식으로 아침 7시에.',
            points: ['출처·근거가 엇갈리면 안전한 쪽으로 결론 + 근거 한 줄', '근거 없는 수치는 [확인 필요] 표시', '오늘 할 일·미완료·기한을 한 화면에'] },
          { t: 'WON’T 리스트 + 재계획', slug: 'wont-list', status: 'seed', from: '김형',
            lead: '할 일보다 “이번 주 안 할 일”을 먼저 정한다. 큰 프로젝트가 끝나면 24시간 안에 재계획.',
            points: ['오늘/이번 주 WON’T 3개 명시', '큰 일 종료 → 재계획 트리거로 계획 붕괴 방지', '집중을 지키는 건 더하기가 아니라 빼기'] },
          { t: 'MVP 패턴 인사이트', slug: 'pattern-insight', status: 'idea', from: '딜런',
            lead: '기록이 5개 이상 쌓이면, 축적 데이터가 스스로 방향을 보여준다.',
            points: ['카테고리별 평균·반복 패턴 자동 표출', '“이번 주 MVP(가장 쓸모 있던 것)” 뽑기', '되돌아보기와 연결'] },
          { t: '데일리 루틴', slug: 'daily-routine', status: 'seed',
            lead: '매일 반복하는 기본기. 체크만 해도 하루가 굴러가는 최소 세트.',
            points: ['아침: 셸 알림 확인 → 오늘 답할 사람 추리기', '낮: 몰입 1세션 이상', '밤: 오늘의 한 문장 + 되돌아보기'],
            links: [{ label: '셸 주고받기', href: '/m/shell-give-take' }] },
          { t: '분기 목표', slug: 'quarter-goals', status: 'seed',
            lead: '3개월 단위로 “이건 반드시”를 3개만. 많으면 아무것도 안 된다.',
            points: ['개인: 아라미러를 매일 쓰는 도구로', '회사: 아람휴비스 OS 첫 버전', '관계: 스폰지클럽 후기 꾸준히'] },
          { t: '되돌아보기', slug: 'review', status: 'idea', lead: '주·분기 끝에 “뭘 배웠나 / 뭘 접을까”를 정직하게.',
            points: ['잘된 것 3, 접을 것 1', '다음 구간 한 가지 실험 정하기'] },
        ],
      },
      {
        h: '독서',
        items: [
          { t: '읽는 중', slug: 'reading-now', status: 'seed', lead: '지금 펼쳐둔 책들. 끝내야 한다는 압박 없이, 지금 만나는 문장만.',
            points: ['데미안 — 헤르만 헤세', '몰입 — 황농문', '읽다 만 책도 그대로 둔다, 언제든 다시'] },
          { t: '완독 · 서평', slug: 'read-done', status: 'idea', lead: '다 읽은 책은 별점이 아니라 “나를 어떻게 바꿨나” 한 문단으로.',
            points: ['한 권당 핵심 문장 1 + 내 변화 1'] },
          { t: '문장 수집', slug: 'quotes', status: 'building', lead: '밑줄 친 문장 창고. 나중에 글·발표에 인용할 재료.',
            points: ['텔레그램에 문장 던지면 여기 쌓이게', '출처(책·페이지) 자동으로 달기'] },
        ],
      },
      {
        h: '도구 · 앱',
        items: [
          { t: 'Claude 사용량 미터', slug: 'claude-usage', status: 'live', tier: 'auth',
            lead: '내 클로드 사용량을 로컬 서버로 띄워 보는 미터. 얼마나 쓰는지·어디에 쓰는지 가시화.',
            points: ['usage_server.py 로 로컬 실행(사용량서버.bat)', '지하 엔진실(events)과 연결해 활동량과 함께 보기'] },
          { t: 'Calendar — 일정', slug: 'calendar-app', status: 'building',
            lead: '오늘 일정·할일·리포트가 켜면 바로 보이는 무로그인 원스크린.',
            points: ['관제실(/hq) 오늘 뷰와 연결', '날짜 있는 리마인드는 여기로 모으기'] },
        ],
      },
    ],
  },

  {
    icon: '🏢', key: '02', title: '회사 · 아람휴비스', en: 'Company', color: '#ffb457',
    tagline: '가치가 위계를 이긴다',
    branches: [
      {
        h: '비전 · 문화',
        items: [
          { t: '회사 OS (aramhuvis-os)', slug: 'aramhuvis-os', status: 'building',
            lead: '회사 전체를 하나의 운영체제로. 심장은 “가치가 위계를 이긴다”.',
            points: ['aramhuvis-os/ 폴더에서 사내 OS로 발전 중', '금요일 마감 → 토요일 리뷰 리듬', '진행 상황은 중간중간 공유하고 답을 받는 방식'] },
          { t: '핵심 가치', slug: 'core-value', status: 'seed',
            lead: '가치가 위계를 이긴다 — 직급이 아니라 가치가 결정을 이끈다.',
            points: ['옳은 말은 누구 입에서 나오든 옳다', '위에서 정해줘서가 아니라 납득해서 움직인다', '아람 = 아름다운 사람'] },
          { t: '주간 리듬', slug: 'weekly-rhythm', status: 'seed',
            lead: '한 주가 굴러가는 정해진 박자.',
            points: ['금요일: 그 주 결과물 마감', '토요일: 리뷰', '중간: 상태 공유 + 막힌 것 질문'] },
        ],
      },
      {
        h: '시스템 · 프로그램',
        items: [
          { t: '매출 대시보드 (Revenue)', slug: 'revenue-dashboard', status: 'live', tier: 'secret',
            lead: '🔴 대외비. 2026 사업본부 매출·목표달성·미수금을 한눈에 보는 단일 파일 웹 대시보드. 실제 수치는 금고(로컬)에서만.',
            points: ['매출 3단 구분: 실적(회계 인식)/확정(수주)/예상(파이프라인)', '해외·국내·기기별·담당자별·월별 뷰 + 미수금 aging', '실 수치는 배포 안 됨 — /vault(로컬)에서만 열람'],
            links: [{ label: '금고(로컬 전용)', href: '/vault' }] },
          { t: '재무재표', slug: 'financial-statements', status: 'seed', tier: 'secret',
            lead: '🔴 대외비. 5개년 재무상태표·재무분석·재무대시보드. 원본은 엑셀, 금고 연결은 순차 진행.',
            points: ['5개년 재무상태표 / 재무분석 데이터·보고서', '실 수치는 로컬 전용 — 공개 빌드 제외', '엑셀 → 금고 자동연결 예정'],
            links: [{ label: '금고(로컬 전용)', href: '/vault' }] },
          { t: 'Aramcrm — 고객관리', slug: 'aramcrm', status: 'building', tier: 'auth',
            lead: '회사 CRM. 고객·거래·이력을 한 곳에서. (로그인 계층)',
            points: ['영업 파이프라인과 매출 대시보드로 연결', '반복 알림·후속조치 자동화 목표'] },
          { t: 'Aram Huvis OS — 회사 OS', to: '/m/aramhuvis-os', status: 'building' },
          { t: '진행 중 프로젝트', slug: 'projects-active', status: 'idea', lead: '지금 손대고 있는 것들의 한눈 목록. 상태 라벨로 어디까지 왔는지.',
            points: ['각 프로젝트: 다음 한 걸음만 적기', '멈춘 건 멈춤이라고 정직하게'] },
          { t: '아이디어 백로그', slug: 'idea-backlog', status: 'building', lead: '“이거 되겠다” 싶은 것들의 대기열. 버리지 말고 쌓아두기.',
            points: ['텔레그램에 던지면 여기로', '분기마다 하나씩 꺼내 실험'] },
        ],
      },
      {
        h: '팀 · 사람',
        items: [
          { t: '셸(shell) 통합', slug: 'shell-hub', status: 'seed',
            lead: '사내 “셸 통합알림”을 한 곳에서. 매일 아침 누구에게 답할 차례인지 다시 계산한다.',
            points: ['받은 셸 − 보낸 셸 = 내가 갚을 사람', '오래된 로스터를 그대로 읊지 않는다 — 매일 새로 계산', 'Slack #셸-통합알림-bot 이 원천'],
            links: [{ label: '받은 셸 / 보낸 셸', href: '/m/shell-give-take' }, { label: '오늘 답할 사람', href: '/m/shell-today' }] },
          { t: '부서 · 역할', slug: 'org-roles', status: 'idea', lead: '누가 무엇을 맡는지. 위계표가 아니라 “가치를 어디서 내는가” 지도.',
            points: ['사람별 강점 한 줄', '겹치는 일·비는 일 찾기'] },
          { t: '온보딩', slug: 'onboarding', status: 'idea', lead: '새로 온 사람이 첫 주에 볼 것들. OS를 빨리 이해하도록.',
            points: ['핵심 가치부터', '주간 리듬 안내', '셸 문화 소개'] },
        ],
      },
      {
        h: '의사결정',
        items: [
          { t: '결정 카드 로그', slug: 'decision-cards', status: 'seed', from: '르니',
            lead: '고민을 던지면 유형 파악 → 기준을 묻고 → 📌결정/🎯기준/📅날짜 카드로 닫는다. 판단 기준이 자산이 된다.',
            points: ['선택형/방향형/우선순위형으로 유형 분류', '결정·이유·날짜를 카드로 누적', '나중에 흔들릴 때 과거 기준을 되짚음'] },
          { t: '미완료 이월 리마인드', slug: 'carryover', status: 'building', from: '베리 · 로밍',
            lead: '답할 때까지 다음날 아침 리포트에 다시 등장한다. 잊힘 자체를 구조적으로 차단.',
            points: ['“했어/미룰래” 응답으로 처리', '미루면 리스크 한 줄 안내', 'D-3 기한 알림'] },
          { t: '미팅 · 안건', slug: 'meetings', status: 'idea', lead: '회의 전에 안건, 회의 후에 결정만 남긴다. 회의록을 길게 쓰지 않는다.',
            points: ['안건 3개 이하', '끝나면 “결정/담당/기한” 세 줄'] },
          { t: '결정 로그', slug: 'decision-log', status: 'seed',
            lead: '“왜 그렇게 정했나”를 남기는 곳. 나중에 흔들릴 때 근거가 된다.',
            points: ['결정 · 이유 · 날짜', '되돌린 결정도 기록 (배움이니까)'] },
          { t: '리마인드', slug: 'reminders', status: 'idea', lead: '잊으면 안 되는 것들. 때가 되면 알아서 떠오르게.',
            points: ['날짜 있는 건 캘린더로 연결', '사람에게 갚을 것은 셸과 연결'] },
        ],
      },
    ],
  },

  {
    icon: '👥', key: '03', title: '사람 · 관계', en: 'People', color: '#ff5d8f',
    tagline: '오고 가는 마음의 기록',
    branches: [
      {
        h: '스폰지클럽',
        items: [
          { t: '이기적인 스킬러스', slug: 'skillers', status: 'seed',
            lead: '스폰지클럽의 스킬러스 채널. 클로드 코드 스킬을 서로 나누고 후기를 남기는 곳.',
            points: ['내게 맞는 스킬 추천받고 바로 설치', '쓴 스킬은 채널에 후기 공유', '/스킬등록 초안까지 만들어 올리기'] },
          { t: '주차 과제', slug: 'weekly-task', status: 'seed',
            lead: '매주 나오는 과제. 남 것 베끼지 않고 내가 겪은 걸 1인칭으로 쓴다.',
            points: ['핵심 원칙: 내가 실제로 부딪힌 어려움을 쓴다', '읽는 사람(동료)에 맞춰 눈높이 조절', '발표·과제 모두 이 방식'] },
          { t: '후기 · 배움', slug: 'club-learnings', status: 'idea', lead: '모임에서 얻은 것. 흘려보내지 말고 한 줄이라도.',
            points: ['이번 주 가장 쓸모 있던 것 1개'] },
        ],
      },
      {
        h: '셸 · 주고받기',
        items: [
          { t: '자동 셸 선물 봇', slug: 'shell-gift-bot', status: 'live', from: '직접 제작',
            lead: '매일 사라지는 셸을, 한 사람에게 몰리지 않게 조원에게 공정하게 돌아가며 선물하도록 돕는 봇. 순환 대상 계산 + 알림을 자동화했다.',
            points: [
              '나를 뺀 조원을 매일 한 명씩 순서대로 순환 (5조 11명 = 11일 한 바퀴). 기록이 남아 껐다 켜도 순서가 이어짐',
              '선호 인원만 도는 favorites 모드 지원',
              '방식 A(추천): GitHub Actions가 매일 00:01 KST에 오늘 대상+문구를 Slack DM으로 — 내 PC 꺼져도 동작, 전송 1탭만 내가',
              '방식 B: 브라우저 완전 자동(0탭), 단 내 PC가 켜져 있어야 함',
              '제약: `/셸 전달하기`는 Slack 슬래시 명령이라 API가 대신 못 눌러 — 마지막 전송만 사람 몫',
            ],
            links: [{ label: '셸 스튜디오 열기', href: '/shell-studio' }, { label: '셸 통합', href: '/m/shell-hub' }, { label: '오늘 답할 사람', href: '/m/shell-today' }] },
          { t: '받은 셸 / 보낸 셸', slug: 'shell-give-take', status: 'seed',
            lead: '주고받은 셸의 장부. 받은 것과 보낸 것을 나란히 놓으면 내가 갚을 사람이 보인다.',
            points: ['받은 셸 − 보낸 셸 = 미응답', 'Slack #셸-통합알림-bot 에서 매일 새로 계산', '오래된 명단을 그대로 읊지 않기'],
            links: [{ label: '오늘 답할 사람', href: '/m/shell-today' }, { label: '셸 통합', href: '/m/shell-hub' }] },
          { t: '오늘 답할 사람', slug: 'shell-today', status: 'seed',
            lead: '오늘 딱 갚아야 할 사람만 추려주는 칸. 아침마다 갱신.',
            points: ['받은 지 오래된 순으로', '한 명이라도 오늘 갚기', '갚으면 보낸 셸로 이동'] },
          { t: '대화 맥락', slug: 'talk-context', status: 'idea', lead: '이 사람과 지난번에 무슨 얘기까지 했더라 — 를 놓치지 않게.',
            points: ['사람별 마지막 대화 한 줄', '다음에 물어볼 것 메모'] },
        ],
      },
      {
        h: '인맥',
        items: [
          { t: '사람별 노트', slug: 'people-notes', status: 'idea', lead: '한 사람당 한 페이지. 관계는 기억에서 나온다.',
            points: ['어떻게 만났나 · 무엇을 좋아하나', '도움 준 것 · 받은 것'] },
          { t: '소개 · 연결', slug: 'intros', status: 'idea', lead: '누구와 누구를 이어주면 좋을지. 연결이 곧 가치.',
            points: ['A ↔ B 이어주면 좋은 이유 한 줄'] },
          { t: '기억할 것', slug: 'remember-people', status: 'idea', lead: '생일·경조사·약속처럼 놓치면 서운한 것들.',
            points: ['날짜 있는 건 캘린더로', '때 되면 리마인드'] },
        ],
      },
    ],
  },

  {
    icon: '🧠', key: '04', title: '지식 · LLM 위키', en: 'Knowledge', color: '#a78bfa',
    tagline: '던지면 엮이고 서술된다',
    branches: [
      {
        h: '1층 — 사고',
        items: [
          { t: 'durable-first 캡처', slug: 'durable-first', status: 'building', from: '쏭',
            lead: '던지는 순간 원문 그대로(raw) 먼저 저장한다. 절대 안 잃는다. 정리·분류는 나중에 뒤에서.',
            points: ['봇이 꺼져 있어도 말이 유실되지 않게 저장 계층 분리', '정리 결과를 “정답 코퍼스”로 쌓기', '저장 먼저 → 정리는 밤에'] },
          { t: '자동 분류 인풋', slug: 'auto-classify', status: 'seed', from: '스폰지클럽 다수',
            lead: '텔레그램 한 줄을 던지면 알아서 카테고리로 분류돼 쌓인다. 71명 중 가장 많이 나온 공통 패턴.',
            points: ['입력 장벽 0 — 형식 없이 그냥 던지기', '아이디어/할일/위임/참고로 자동 태깅', '키워드로 물으면 검색해줌'] },
          { t: 'journal 포착 (마찰 0)', slug: 'journal-capture', status: 'seed',
            lead: '가장 아래층. 떠오른 생각을 아무렇게나, 마찰 0으로 던지는 곳. 정리는 나중에.',
            points: ['텔레그램 한 줄 = 입력 끝', '밤마다 알아서 제자리 칸으로 분류', '“완벽하게 쓰려는 마음”이 최대의 적'] },
          { t: 'First Principles', slug: 'first-principles', status: 'seed',
            lead: '“원래 그런 거”를 걷어내고 바닥부터 다시 쌓는 사고. 남의 결론이 아니라 내 추론.',
            points: ['이건 정말 참인가? 왜?', '관습·권위를 근거로 쓰지 않기', '쪼갤 수 있을 때까지 쪼개기'] },
        ],
      },
      {
        h: '2층 — 지식',
        items: [
          { t: 'threads — 반복 주제 승격', slug: 'threads', status: 'building',
            lead: '1층에서 같은 주제가 여러 번 나오면, 그걸 하나의 “실(thread)”로 묶어 2층으로 올린다.',
            points: ['3번 이상 나온 생각 = 승격 후보', '흩어진 조각을 하나의 흐름으로', '여기서부터 “지식”이 된다'] },
          { t: 'wiki 아티클 — 카파시 방식', slug: 'wiki-article', status: 'building',
            lead: 'Karpathy식 오토리서치: 주제를 주면 검색·정리해 위키 페이지로 자동 서술.',
            points: ['objective를 정하면 루프가 깊이까지 파고듦', '출처 달고, 검증하고, 페이지로 저장', '지식베이스에 바로 쌓임'] },
          { t: '내 것 vs 외부 교차', slug: 'mine-vs-external', status: 'seed',
            lead: '내가 떠올린 것과 남에게서 가져온 것을 반드시 가른다. 섞이면 내 오리지널 값이 희석된다.',
            points: ['왼쪽 내 생각(자산) · 오른쪽 외부(연료)', '외부엔 반드시 출처', 'AI는 편집자일 뿐, 생각은 내 것'],
            links: [{ label: '생각의 벽', href: '/wall' }] },
        ],
      },
      {
        h: '리서치',
        items: [
          { t: '벤치마크 엔진', slug: 'benchmark', status: 'idea', lead: '비슷한 서비스·글을 모아 “저들은 이렇게 했다”를 정리하는 칸.',
            points: ['참고 화면·구조 캡처', '우리와 다른 점 한 줄'] },
          { t: '외부 개념 수집', slug: 'external-concepts', status: 'idea', lead: '새로 배운 개념 창고. 나중에 내 것과 교차시킬 재료.',
            points: ['개념 한 줄 정의 + 출처', '내 상황에 어떻게 쓸지 메모'] },
        ],
      },
    ],
  },

  {
    icon: '📦', key: '05', title: '자산 · 아웃풋', en: 'Assets', color: '#34d3c0',
    tagline: '생각이 밖으로 나가 가치가 된다',
    branches: [
      {
        h: '발표',
        items: [
          { t: 'NYU Stern 발표', slug: 'nyu-stern', status: 'seed',
            lead: '밖으로 내보내는 큰 발표. 내가 만든 것과 생각을 남의 언어가 아닌 내 언어로.',
            points: ['핵심 메시지 한 문장 먼저', '남 것 베끼지 않고 내 경험으로', '시각 자료로 눈높이 맞추기'] },
          { t: '사내 발표 덱', slug: 'internal-deck', status: 'idea', lead: '회사 안에서 쓰는 발표 자료 모음.',
            points: ['재사용 가능한 표준 슬라이드', '가치가 위계를 이긴다 톤 유지'] },
        ],
      },
      {
        h: '글 · SNS',
        items: [
          { t: '캐러셀 스튜디오', to: '/studio', status: 'live' },
          { t: '빌드로그', to: '/build-logs', status: 'live' },
          { t: '이중언어 포스트 (KR/EN)', slug: 'bilingual', status: 'seed',
            lead: '빌드로그·블로그 글은 기본으로 한국어 아래 영어 번역을 붙인다.',
            points: ['한국어 먼저, 그 아래 English', '같은 내용을 두 언어로 — 더 넓은 독자', '발행은 발행 페이지에서'],
            links: [{ label: '발행', href: '/publish' }, { label: '빌드로그', href: '/build-logs' }] },
        ],
      },
      {
        h: '웹서비스',
        items: [
          { t: 'Aramirror 자체', to: '/', status: 'live' },
        ],
      },
      {
        h: '책',
        items: [
          { t: '우리만의 책 (book/)', slug: 'our-book', status: 'idea',
            lead: '쌓인 생각·빌드로그가 언젠가 한 권의 책이 된다. 지금은 씨앗.',
            points: ['빌드로그 = 책의 초고 조각들', '장별로 실(thread) 묶기', '서두르지 않기'] },
        ],
      },
    ],
  },
];

// /m/[slug] 이 상세 페이지를 만들 항목만 뽑아준다 (to 로 다른 페이지 가는 건 제외).
export function detailItems() {
  const out = [];
  for (const d of domains) {
    for (const b of d.branches) {
      for (const it of b.items) {
        if (it.to) continue;
        out.push({ ...it, domainTitle: d.title, domainIcon: d.icon, domainColor: d.color, domainKey: d.key, branch: b.h });
      }
    }
  }
  return out;
}

export function statusMeta(status) {
  return S[status] || S.idea;
}
