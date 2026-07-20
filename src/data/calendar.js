// 달력(Luxe Calendar) 스튜디오 데이터 — 사장님이 개발한 일정·예약·미팅 앱을
// 아라미러 한 화면에서 소개·연결하기 위한 단일 소스.
// 실제 앱 코드: Project/Calender (Next.js 14 + Prisma + NextAuth). 서버 앱이라 라이브(정적)엔
// 통째로 못 올리고, 여기선 무엇을 하는 앱인지 보여주고 실행 방법으로 연결한다.

export const cal = {
  name: 'Luxe Calendar',
  ko: '일정·예약·미팅 조율 앱',
  stack: 'Next.js 14 · Prisma(Supabase) · NextAuth(Google) · Electron',
  intro: '일정 관리에서 끝나지 않고, 예약 링크로 남이 내 빈 시간을 잡고, 미팅 시간을 자동으로 조율하고, 구글 캘린더와 양방향 동기화까지 하는 개인 스케줄 OS.',
};

// 5개 탭 = 앱의 핵심 기능
export const features = [
  { key: 'calendar', n: '01', t: '일정 (Calendar)',   d: '월·주·일 보기로 일정을 관리. 구글 캘린더와 동기화되어 한 곳에서 본다.' },
  { key: 'meeting',  n: '02', t: '미팅 조율 (Meeting)', d: '상대에게 후보 시간을 제안 → 상대가 고르면 확정. 서로 캘린더 안 맞춰도 됨.' },
  { key: 'links',    n: '03', t: '예약 링크 (Links)',   d: '내 예약 페이지 링크(+QR)를 공유하면, 상대가 내 빈 슬롯 중 골라 예약한다.' },
  { key: 'alerts',   n: '04', t: '알림 (Alerts)',       d: '웹 푸시 + 이메일 + 슬랙으로 일정·예약 리마인더를 자동 발송.' },
  { key: 'settings', n: '05', t: '설정 (Settings)',     d: '구글 연동 상태, 알림 채널, 계정 설정을 한 곳에서.' },
];

// 뒤에서 도는 자동화·연동
export const integrations = [
  { t: '구글 캘린더 동기화', d: 'googleapis로 양방향 동기화 + iCal 내보내기 (calendar/sync · calendar/ical)' },
  { t: '자동 리마인더',     d: 'cron이 다가온 일정·예약을 감지해 미리 알림 (cron/reminders)' },
  { t: '웹 푸시 알림',      d: 'web-push(VAPID)로 브라우저·PC에 바로 알림 (notifications/subscribe)' },
  { t: '이메일 · 슬랙',     d: 'nodemailer(SMTP) 메일 + 슬랙 웹훅으로 확정·리마인더 발송' },
];

// 실행 방식 두 가지 (셸 봇과 같은 구조)
export const runModes = [
  {
    key: 'A', name: '웹 · 개발 서버', tag: '가장 간단',
    how: '레포에서 npm run dev → 브라우저로 http://localhost:3000 접속',
    where: '내 PC(개발 서버) · 팀에 열려면 배포(Vercel 등) 필요',
    need: 'Node · .env(구글 OAuth·DB·SMTP) 설정',
    files: 'npm run dev',
  },
  {
    key: 'B', name: 'PC 앱 · Electron', tag: '데스크톱',
    how: '독립 실행 데스크톱 앱으로 빌드해 아이콘 눌러 실행 (Luxe Calendar.exe)',
    where: '내 PC · 브라우저 없이 창으로',
    need: 'npm run electron:build (win: nsis 설치본)',
    files: 'electron/main.js · npm run electron:start',
  },
];

// 사장님이 채워야 하는 1회 설정(민감값이라 코드로 못 넣음)
export const setup = [
  '구글 OAuth 클라이언트 생성 → GOOGLE_CLIENT_ID / SECRET',
  'Supabase PostgreSQL → DATABASE_URL (prisma migrate)',
  'NEXTAUTH_SECRET · SMTP(메일) · VAPID(웹푸시) 키 발급',
  '.env 에 채우고 npm run dev 로 로그인 → 구글 연동',
];
