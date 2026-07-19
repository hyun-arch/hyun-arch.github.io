// 셸 스튜디오 데이터 — '자동 셸 선물 봇'을 눈으로 보고 굴리는 화면의 단일 소스.
// 실제 봇 코드는 Project/자동 셸 선물 봇 에 있고, 여기선 그 원리를 그대로 미리보기한다.
// (민감정보인 Slack ID 는 넣지 않는다. 공개 닉네임만.)

export const shell = {
  team: '5조',
  owner: '아람(박상현)',
  // 나(owner)를 뺀 조원. 매일 한 명씩 순서대로 순환 (11명 = 11일 한 바퀴).
  roster: ['그레이', '리카', '양세', '잭', '차지원', '채리', '챈', '최강훈', '치코', '포비', '필리줄리'],
  // favorites 모드: 이 안에서만 순환.
  favorites: ['그레이', '포비', '리카', '필리줄리', '채리'],
  // 매일 자동으로 하나 골라 붙는 코멘트.
  comments: [
    '오늘도 화이팅입니다! 🐚',
    '당신의 하루를 응원해요 🙌',
    '작은 셸 하나 놓고 갑니다 😊',
    '오늘 한 걸음도 충분히 멋져요 ✨',
    '고생 많았어요, 셸 드려요 🐚',
  ],
  // 순환 기준일. 이 날 roster[0]이 대상, 이후 하루에 한 칸씩 넘어간다.
  anchor: '2026-07-19',
  slash: '/셸 전달하기',
};

export const stages = [
  { id: 'today',   n: '01', t: '오늘 대상' },
  { id: 'roster',  n: '02', t: '순환 명단' },
  { id: 'message', n: '03', t: '전송 문구' },
  { id: 'modes',   n: '04', t: '두 가지 방식' },
  { id: 'manual',  n: '05', t: '사용 매뉴얼' },
];

// 실제 순환 규칙(rotation.py 기준). 웹 미리보기는 이걸 날짜로 근사한 것.
export const rotationRule = '실제 봇은 state.json에 준 기록을 남겨 "가장 적게 받은 사람 · 가장 오래전에 받은 사람"을 먼저 고른다(공정 우선). 아래 미리보기는 날짜 기반 근사치.';

// 두 가지 실행 방식 — 둘 다 한 레포 안에 들어있고, 실제로 각각 돌려봤다.
export const modes = [
  {
    key: 'A', name: '웹 · 클라우드 리마인더', tag: '추천',
    how: 'GitHub Actions가 매일 00:01 KST에 reminder.py를 돌려, 오늘 대상 + 바로 쓸 명령어를 내 Slack으로 DM',
    auto: '대상 계산·알림 자동 · 마지막 전송 1탭만 나',
    where: 'GitHub 클라우드 — 내 PC 꺼져 있어도 됨',
    need: '표준 라이브러리만(설치 X) · Slack 봇 토큰',
    stable: '매우 높음',
    files: 'reminder.py · .github/workflows/daily.yml',
  },
  {
    key: 'B', name: 'PC 앱 · 브라우저 완전자동', tag: '0탭',
    how: 'Windows 작업 스케줄러가 매일 run_auto.bat 호출 → auto_send.py(Playwright)가 Slack에서 대신 전송',
    auto: '0탭 완전 자동',
    where: '내 PC — 그 시각에 켜져 있어야 함',
    need: 'Python + Playwright 설치',
    stable: 'Slack 화면 바뀌면 보정 필요',
    files: 'auto_send.py · run_auto.bat',
  },
];

// 남들도 내 봇을 쓸 수 있게 하는 매뉴얼 (1~6조 공통 + 방식별).
export const manual = {
  common: [
    '이 레포를 복제(clone)한다',
    'config.json — team을 내 조로, mode를 rotate_all(전체 순환) 또는 favorites로',
    'data/members.json — 우리 조 명단(닉네임·이름·slack_id) 채우기',
    '미리보기: 터미널에서 python rotation.py → 오늘 누가 대상인지 확인',
  ],
  tracks: [
    {
      key: 'A', title: '방식 A · 웹(클라우드) 설치',
      steps: [
        'Slack 앱 만들고 봇 토큰 발급 (권한: chat:write, im:write)',
        '레포 Settings → Secrets and variables → Actions → New secret 에 SLACK_BOT_TOKEN 저장',
        'Actions 탭에서 "매일 셀 리마인더" 워크플로우 켜기',
        '끝 — 매일 00:01 KST에 오늘 대상 DM이 온다 (내 PC 꺼져 있어도 됨)',
      ],
    },
    {
      key: 'B', title: '방식 B · PC 앱(완전자동) 설치',
      steps: [
        'Python 설치 → pip install playwright && playwright install',
        'run_auto.bat의 Python 경로를 내 PC 경로로 맞추기',
        'Windows 작업 스케줄러에 매일 원하는 시각으로 run_auto.bat 등록',
        '끝 — PC가 켜져 있으면 그 시각에 Slack에서 자동 전송(0탭). 로그는 run.log',
      ],
    },
  ],
};
