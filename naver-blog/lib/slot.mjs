// 예약 발행 자리를 잡는다 — **오전 6:30 · 오후 4:30**, 하루 두 번.
//
//   import { 다음자리, 자리들 } from './lib/slot.mjs';
//   다음자리()            지금 이후 가장 빠른 자리
//   자리들(5)             앞으로 5개 자리를 차례로
//
// 왜 이 두 시각인가 (2026-10-23 부사장 지시) —
//   6:30 은 출근 전에 읽는 시간, 16:30 은 퇴근 전에 읽는 시간이다.
//   글이 올라오자마자 읽히는 자리에 두면 체류·댓글이 붙고, 그게 노출로 돌아온다.
//
// 왜 「지금 올리기」를 안 쓰나 —
//   하루에 여러 편을 몰아 올리면 앞 글이 묻힌다. 자리를 나눠 두면
//   같은 글 수로도 노출이 두 번 생긴다.

export const 시각들 = [[6, 30], [16, 30]];

/** 기준 시각 이후 가장 빠른 예약 자리 (기본: 지금) */
export function 다음자리(기준 = new Date()) {
  // 너무 촉박하면 네이버가 거부한다. 10분 여유를 둔다.
  const 최소 = new Date(기준.getTime() + 10 * 60 * 1000);
  for (let 더함 = 0; 더함 < 30; 더함 += 1) {
    const 날 = new Date(최소);
    날.setDate(날.getDate() + 더함);
    for (const [시, 분] of 시각들) {
      const t = new Date(날.getFullYear(), 날.getMonth(), 날.getDate(), 시, 분, 0, 0);
      if (t > 최소) return t;
    }
  }
  return null;
}

/** 앞으로 n 개 자리를 차례로 — 여러 편을 한 번에 예약할 때 */
export function 자리들(n, 기준 = new Date()) {
  const 결과 = [];
  let 커서 = 기준;
  for (let i = 0; i < n; i += 1) {
    const t = 다음자리(커서);
    if (!t) break;
    결과.push(t);
    커서 = new Date(t.getTime() + 60 * 1000);   // 그 자리 바로 뒤부터 다시 찾는다
  }
  return 결과;
}

export const 보기 = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} `
  + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
