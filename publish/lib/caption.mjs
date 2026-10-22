// 채널마다 글자 수 세는 법과 한도가 다르다. 한 번 쓴 글을 채널별로 맞춰 준다.
// (사이트 /publish 페이지가 쓰던 규칙과 같은 규칙이다.)

// X 는 한글·한자·가나를 2자로 센다.
export function xWeight(s) {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const cjk =
      (c >= 0x1100 && c <= 0x11ff) || (c >= 0x2e80 && c <= 0xa4cf) ||
      (c >= 0xa960 && c <= 0xa97f) || (c >= 0xac00 && c <= 0xd7ff) ||
      (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) ||
      (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3ffff);
    n += cjk ? 2 : 1;
  }
  return n;
}
const plain = (s) => [...s].length;

/** 한도 안으로 줄인다. 꼬리(링크·해시태그)는 지키고 본문을 줄인다. */
export function fit(core, limit, tail = '', weigh = plain) {
  const whole = core + tail;
  if (!limit || weigh(whole) <= limit) return { text: whole, count: weigh(whole), fits: true };
  const arr = [...core];
  const build = (n) => arr.slice(0, n).join('').replace(/\s+$/, '') + '…' + tail;
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (weigh(build(mid)) <= limit) lo = mid; else hi = mid - 1;
  }
  const text = build(lo);
  return { text, count: weigh(text), fits: weigh(text) <= limit };
}

export const weigherFor = (key) => (key === 'x' ? xWeight : plain);

/** 해시태그 정리 — 채널마다 붙일 개수만 다르다 */
export function tags(list = [], n = 5) {
  return list.slice(0, n).map((t) => '#' + String(t).replace(/^#/, '').replace(/\s+/g, '')).join(' ');
}
