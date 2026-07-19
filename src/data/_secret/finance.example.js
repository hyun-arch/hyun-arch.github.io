// 🔴 비밀 데이터 "모양"만 보여주는 예시 템플릿입니다 (커밋됨 · 값은 전부 0/placeholder).
//
// 실제 재무·매출을 넣으려면:
//   1) 이 파일을 같은 폴더에 `finance.js` 로 복사한다.
//   2) finance.js 안의 값을 실제 수치로 채운다.
//   3) 끝. finance.js 는 .gitignore 로 커밋되지 않고,
//      `npm run build`(배포)에서도 제외되어 오직 로컬 `npm run dev` 에서만 보인다.
//
// ⚠️ 실제 수치를 이 example 파일에 적지 마세요 — example 은 커밋됩니다.

export default {
  tier: 'secret',
  updated: '2026-01-01',
  revenue: {
    // 월별 매출 (단위: 원) — 실제 값은 로컬 finance.js 에만
    monthly: [
      { month: '2026-01', amount: 0 },
    ],
    note: '실제 매출 수치는 로컬 finance.js 에만 존재합니다.',
  },
  financials: {
    // 재무제표 요약 — placeholder
    assets: 0,
    liabilities: 0,
    equity: 0,
    note: '실제 재무 수치는 로컬 finance.js 에만 존재합니다.',
  },
};
