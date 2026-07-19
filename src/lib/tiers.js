// 계층(tier) 시스템 + 🔴 비밀 데이터 로더.
//
// 이 파일이 아라미러 v2 보안의 심장이다. 데이터는 3계층으로 나뉜다:
//   🟢 public — 누구나 열람 (그대로 배포)
//   🟡 auth   — 로그인해야 열람 (Supabase Auth, 다음 슬라이스)
//   🔴 secret — 로컬(내 PC)에서만. 배포에서 물리적으로 제외 (재무·매출)
//
// 핵심 원리: 🔴 secret 데이터는 오직 이 파일을 통해서만, 오직 로컬 dev 에서만 로드된다.
//   - 로컬 `npm run dev`  → src/data/_secret/*.js 를 읽어 화면에 표시
//   - `npm run build`(배포) → 아래 glob 이 {} 로 치환·트리셰이킹되어,
//     배포 산출물(dist)에 비밀 데이터가 "존재 자체를 하지 않는다".
//   → 유출 경로가 코드가 아니라 빌드 단계에서 원천 차단된다.

export const TIERS = {
  public: { key: 'public', label: '공개',  dot: '🟢', desc: '누구나 열람' },
  auth:   { key: 'auth',   label: '로그인', dot: '🟡', desc: '로그인해야 열람 (Supabase Auth)' },
  secret: { key: 'secret', label: '비밀',  dot: '🔴', desc: '로컬(내 PC)에서만 · 배포 제외' },
};

// Vite 가 빌드 시 리터럴 boolean 으로 치환한다 → 아래 분기가 프로덕션에서 죽은 코드로 제거됨.
export const isDev = import.meta.env.DEV;

// 🔴 비밀 데이터: src/data/_secret/*.js (gitignore + 배포 제외).
//   dev 에서만 glob 이 파일을 잡고, 프로덕션에서는 {} 라 dist 에 흔적이 없다.
const secretModules = isDev
  ? import.meta.glob('../data/_secret/*.js', { eager: true })
  : {};

// 비밀 데이터를 { 파일명: 내용 } 맵으로 반환. 프로덕션에서는 항상 {}.
// 예시 템플릿(*.example.js)은 제외한다.
export function loadSecret() {
  if (!isDev) return {};
  const out = {};
  for (const [path, mod] of Object.entries(secretModules)) {
    const name = path.split('/').pop().replace(/\.js$/, '');
    if (name.endsWith('.example')) continue;
    out[name] = (mod && mod.default) ? mod.default : mod;
  }
  return out;
}

// 특정 계층을 지금 화면에 보여줘도 되는지.
//   secret → dev 에서만 true
//   auth   → (다음 슬라이스) 로그인 여부로 판정. 지금은 dev 에서만 열어둔다.
//   public → 항상 true
export function canShowTier(tier) {
  if (tier === 'secret') return isDev;
  if (tier === 'auth') return isDev; // TODO: Supabase Auth 로그인 상태로 교체
  return true;
}
