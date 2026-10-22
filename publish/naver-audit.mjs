#!/usr/bin/env node
// 발행된 네이버 글을 **전부** 열어 본다. 눈으로 보는 대신 기준으로 센다.
//
//   node publish/naver-audit.mjs                     전체
//   node publish/naver-audit.mjs --글 224450821499   한 편만
//   node publish/naver-audit.mjs --자세히            걸린 줄을 그대로 보여 준다
//
// 왜 만들었나 (2026-10-23) —
//   「## 과 ** 만」 세어 보고 「깨끗하다」고 말했다. 그 기준에 안 걸리는
//   [이름](주소) · - 목록 · > 인용 · | 표 · --- 구분선 · ` 코드 는 그대로 있었다.
//   기준이 좁으면 0이 나오는 게 당연하다. 0은 「없다」가 아니라 「내 기준에 안 걸렸다」였다.
const blogId = process.argv.includes('--blog')
  ? process.argv[process.argv.indexOf('--blog') + 1] : 'ianlove80';
const 한편 = process.argv.includes('--글')
  ? process.argv[process.argv.indexOf('--글') + 1] : null;
const 자세히 = process.argv.includes('--자세히');

const UA = { 'user-agent': 'Mozilla/5.0' };
const 풀기 = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

// 브랜드마다 맞는 주소 — 광고 계정의 랜딩(pcChannelKey)이 기준이다
const 바른주소 = { 릴라이: 'lilai.ai', 엘라피엘: 'ellapiel.co.kr', 메디커스텀: 'medicustom.co.kr' };
const 틀린주소 = ['atolian.cafe24.com', 'atorien'];

// 본문에 남아 있으면 안 되는 마크다운
const 찌꺼기규칙 = [
  ['제목기호 ##', /^#{1,6}\s+\S/],
  ['굵게 **', /\*\*/],
  ['기울임 _x_', /(^|\s)_[^_\s][^_]*_(\s|$)/],
  ['링크 [이름](주소)', /\[[^\]]+\]\(\s*https?:/],
  ['목록 - 또는 *', /^[-*]\s+\S/],
  ['인용 >', /^>\s+\S/],
  ['표 |', /^\s*\|.*\|\s*$/],
  ['구분선 ---', /^(-{3,}|={3,}|\*{3,})\s*$/],
  ['코드 `', /`[^`]+`/],
  ['각주 [^1]', /\[\^\d+\]/],
];

async function 글목록() {
  const 모음 = new Map();
  for (let pg = 1; pg <= 4; pg += 1) {
    const s = await fetch(
      `https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${pg}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
      { headers: UA }).then((r) => r.text());
    const 전 = 모음.size;
    for (const m of s.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
      모음.set(m[1], decodeURIComponent(m[2].replace(/\+/g, ' ')));
    }
    if (모음.size === 전) break;      // 더 없으면 멈춘다
  }
  return [...모음.entries()];
}

async function 본문읽기(id) {
  const html = await fetch(
    `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${id}`, { headers: UA })
    .then((r) => r.text());
  const i = html.indexOf('se-main-container');
  if (i < 0) return null;
  const 조각 = html.slice(i, i + 150000)
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, '\n');
  const 줄 = 풀기(조각).split('\n').map((x) => x.trim()).filter(Boolean);
  // 네이버가 모든 글 밑에 붙이는 안내문 — 여기서 자른다
  const 끝 = 줄.findIndex((x) => /블로그 마켓|이 글에 댓글 단 블로거|글보내기 서비스 안내/.test(x));
  return 줄.slice(1, 끝 < 0 ? 줄.length : 끝);
}

const 글들 = 한편 ? [[한편, '(지정한 글)']] : await 글목록();
console.log(`  ${blogId} — 글 ${글들.length}편을 봅니다\n`);

const 문제있는글 = [];
for (const [id, 제목] of 글들) {
  const 줄 = await 본문읽기(id);
  if (!줄) { console.log(`  ? ${id}  본문을 못 읽었습니다 — ${제목}`); continue; }
  const 본문 = 줄.join('\n');

  const 걸림 = [];
  for (const [이름, re] of 찌꺼기규칙) {
    const 해당 = 줄.filter((x) => (re.source.startsWith('^') ? re.test(x) : re.test(x)));
    // 태그줄(#두피케어)은 제목기호가 아니다
    const 진짜 = 이름 === '제목기호 ##' ? 해당.filter((x) => /^#{1,6}\s/.test(x)) : 해당;
    if (진짜.length) 걸림.push([이름, 진짜]);
  }
  for (const 틀 of 틀린주소) {
    const 해당 = 줄.filter((x) => x.includes(틀));
    if (해당.length) 걸림.push([`틀린 주소 ${틀}`, 해당]);
  }
  // 브랜드를 말하면서 그 브랜드 주소가 아예 없으면 알린다
  for (const [브랜드, 주소] of Object.entries(바른주소)) {
    if (본문.includes(브랜드) && 본문.includes('공식몰') && !본문.includes(주소)) {
      걸림.push([`${브랜드} 공식몰인데 ${주소} 가 없음`, []]);
    }
  }
  // 블로그 홈만 가리키는 내부 링크 — 글을 못 찾아간다
  const 홈링크 = 줄.filter((x) => new RegExp(`blog\\.naver\\.com/${blogId}(?![/\\w])`).test(x));
  if (홈링크.length) 걸림.push([`글이 아니라 블로그 홈을 가리키는 링크 ${홈링크.length}개`, 홈링크]);

  const 표시 = 걸림.length ? '✗' : '✓';
  console.log(`  ${표시} ${id}  ${제목.slice(0, 40)}  (${본문.length}자)`);
  for (const [이름, 줄들] of 걸림) {
    console.log(`       ${이름}${줄들.length ? ` — ${줄들.length}줄` : ''}`);
    if (자세히) 줄들.slice(0, 4).forEach((x) => console.log(`         · ${x.slice(0, 110)}`));
  }
  if (걸림.length) 문제있는글.push([id, 제목, 걸림]);
}

console.log(`\n  깨끗 ${글들.length - 문제있는글.length}편 · 손볼 것 ${문제있는글.length}편`);
if (문제있는글.length) {
  console.log('\n  손볼 글:');
  문제있는글.forEach(([id, 제목, 걸림]) =>
    console.log(`   ${id}  ${제목.slice(0, 36)}  ← ${걸림.map((x) => x[0]).join(', ')}`));
}
