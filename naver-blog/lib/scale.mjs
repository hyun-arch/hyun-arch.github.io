// 키워드 저울 — 글감을 네 가지로 달아 본다.
//
//   체급   내가 이길 수 있는 크기인가   (경쟁 글 수 ≤ 내 기준선)
//   트렌드 지금 네이버에서 뜨는가       (최근 검색 흐름)
//   시즌   작년 이맘때 곡선이 오르는가  (전년 동월 대비)
//   황금   찾는 사람에 비해 글이 적은가 (월검색량 ÷ 경쟁글수)
//
// 체급이 가장 중요하다. 월 17만 번 검색되는 '부산가볼만한곳'은 경쟁 글이 231만 개라
// 유입이 0이었고, 월 560번짜리 '쌍곡예그리나펜션'은 경쟁 글 189개라 27명이 들어왔다.
// 큰 키워드를 노리는 게 아니라 '내가 1페이지에 들어갈 수 있는' 키워드를 고르는 일이다.
import { load } from './standards.mjs';

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v);

/**
 * @param {object} m 측정값 { keyword, monthlySearch, rivalPosts, trend, seasonRatio }
 *   monthlySearch 월 검색량        (검색광고 API)
 *   rivalPosts    경쟁 글 수        (검색 API totalResults)
 *   trend         최근 상승률 0~1   (데이터랩)
 *   seasonRatio   전년 동월 대비 배수 (데이터랩)
 */
export function weigh(m) {
  const s = load();
  const B = s.기준선;
  const out = { keyword: m.keyword, scores: {}, pass: {}, notes: [] };

  // ① 체급 — 넘으면 탈락. 가장 엄격하게 본다.
  if (ok(m.rivalPosts)) {
    const ratio = m.rivalPosts / B.경쟁글_상한;
    out.pass.체급 = m.rivalPosts <= B.경쟁글_상한;
    out.scores.체급 = Math.max(0, Math.min(1, 1 - ratio));
    out.notes.push(`경쟁 글 ${m.rivalPosts.toLocaleString()}개 / 내 기준선 ${B.경쟁글_상한.toLocaleString()}개`);
  }

  // ② 황금 — 찾는 사람 대비 글이 적은가
  if (ok(m.monthlySearch) && ok(m.rivalPosts) && m.rivalPosts > 0) {
    const golden = m.monthlySearch / m.rivalPosts;
    out.pass.황금 = golden >= B.황금비_합격선;
    out.scores.황금 = Math.min(1, golden / (B.황금비_합격선 * 4));
    out.notes.push(`황금비 ${golden.toFixed(4)} (합격선 ${B.황금비_합격선})`);
  }

  // ③ 트렌드 — 지금 뜨는가
  if (ok(m.trend)) {
    out.pass.트렌드 = m.trend >= 0.5;
    out.scores.트렌드 = Math.max(0, Math.min(1, m.trend));
  }

  // ④ 시즌 — 작년 이맘때 올랐는가. 오르는 구간 3개월 전에 쓰는 게 좋다.
  if (ok(m.seasonRatio)) {
    out.pass.시즌 = m.seasonRatio >= 1.3;
    out.scores.시즌 = Math.max(0, Math.min(1, (m.seasonRatio - 1) / 1.5));
    if (m.seasonRatio >= 2) out.notes.push(`작년 이맘때 ${m.seasonRatio.toFixed(2)}배로 오르던 구간`);
  }

  // 최소 검색량 — 아무도 안 찾는 말은 쓸 이유가 없다
  if (ok(m.monthlySearch)) {
    out.pass.검색량 = m.monthlySearch >= B.최소_월검색량;
    if (!out.pass.검색량) out.notes.push(`월 검색 ${m.monthlySearch}회 — 최소 ${B.최소_월검색량}회 미만`);
  }

  // 종합 — 체급은 통과/탈락, 나머지는 점수
  const weights = { 체급: 0.40, 황금: 0.30, 시즌: 0.18, 트렌드: 0.12 };
  let total = 0, used = 0;
  for (const [k, w] of Object.entries(weights)) {
    if (ok(out.scores[k])) { total += out.scores[k] * w; used += w; }
  }
  out.score = used ? Math.round((total / used) * 100) : null;

  // 체급이나 검색량에서 떨어지면 점수와 무관하게 쓰지 않는다
  const hardFail = out.pass.체급 === false || out.pass.검색량 === false;
  out.verdict = hardFail ? '탈락' : out.score >= 65 ? '좋음' : out.score >= 45 ? '보통' : '약함';
  out.why = hardFail
    ? (out.pass.체급 === false ? '내 체급을 넘는 키워드예요. 1페이지에 못 들어갑니다.' : '찾는 사람이 너무 적어요.')
    : out.verdict === '좋음' ? '지금 쓰기 좋은 글감이에요.'
    : out.verdict === '보통' ? '쓸 수는 있지만 더 나은 글감을 더 찾아보세요.'
    : '이 글감으로는 유입이 잘 안 나올 거예요.';
  return out;
}

/** 여러 후보를 달아서 좋은 순으로 */
export function rank(list) {
  return list.map(weigh)
    .sort((a, b) => (a.verdict === '탈락') - (b.verdict === '탈락') || (b.score ?? 0) - (a.score ?? 0));
}
