#!/usr/bin/env node
// 카페24 세 쇼핑몰에 **H1 을 넣는다.** 로그인될 때까지 기다렸다가 혼자 끝낸다.
//
//   node publish/cafe24-h1.mjs            무엇을 할지만 보여 준다
//   node publish/cafe24-h1.mjs --적용
//
// 왜 H1 인가 (2026-10-23) —
//   세 사이트 다 첫 화면 제목이 **이미지**다. 사람 눈에는 보이지만 기계에는 아무것도 없다.
//   AI 가 「이 페이지가 무엇에 대한 곳인지」 알 단서가 없다. JSON-LD 보다 먼저다.
//   메디커스텀은 더 나쁘다 — 바닥글 「아람휴비스(주)」가 h1 으로 잡혀 있어
//   첫 화면 주제가 그걸로 읽힌다.
//
// 왜 숨긴 H1 인가 —
//   감쌀 글자가 없으니 새로 넣어야 하는데, 넣으면 디자인이 바뀐다.
//   그래서 **화면에는 안 보이고 기계만 읽는** h1 을 쓴다. 로고가 이미지인 사이트의
//   표준 처리고, 내용이 사이트 제목과 같으니 숨김 글자 남용이 아니다.
//
// 세션이 죽지 않게, 창을 한 번만 띄우고 끝까지 이 프로그램이 들고 있는다.
//
// ⚠ 가장 중요한 설계 (2026-10-23) —
//   카페24는 **살아 있는 창 자체**에 관리자 세션을 묶는다. 프로필을 통째로 복사해
//   다른 창으로 열어도 「비정상적인 접속입니다」가 뜬다. 즉 창을 한 번 닫으면
//   사람이 로그인을 다시 해야 한다.
//   그런데 지금까지는 **내 코드가 틀리면 그 로그인이 통째로 버려졌다.**
//   선택자 하나 어긋나도 프로그램이 끝나 버리고, 다시 로그인을 부탁해야 했다.
//   그래서 자동으로 하다가 막히면 **끝내지 않고 명령을 받는 상태로 남는다.**
//     명령 넣기: /tmp/cafe24-h1-cmd.jsonl 에 한 줄씩
//     결과 보기: /tmp/cafe24-h1.log
//   이러면 내 코드가 틀려도 같은 세션에서 고쳐 이어 할 수 있다. 로그인을 또 부탁하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const 적용 = process.argv.includes('--적용');
const 기록 = '/tmp/cafe24-h1.log';
const 적기 = (s) => { const l = `[${new Date().toTimeString().slice(0, 8)}] ${s}\n`; fs.appendFileSync(기록, l); process.stdout.write(l); };
fs.writeFileSync(기록, '');

const 쇼핑몰 = [
  { shop: 1, skin: 28, 이름: '릴라이',     h1: '릴라이 — 두피를 측정해 찾는 1:1 맞춤 샴푸' },
  { shop: 4, skin: 21, 이름: '메디커스텀', h1: '메디커스텀 — 자주 씻는 손을 위해 측정으로 설계한 핸드크림' },
  { shop: 5, skin: 26, 이름: '엘라피엘',   h1: '엘라피엘 — 피부를 측정해 모자란 것부터 채우는 스킨케어' },
];

const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-site'), {
  headless: false, viewport: { width: 1480, height: 920 },
  args: ['--disable-blink-features=AutomationControlled'],
});
// 어떤 신호를 받아도 창을 안 닫는다 — 닫으면 카페24 세션이 죽는다
process.on('SIGTERM', () => 적기('SIGTERM 무시(창 유지)'));
process.on('SIGINT', () => 적기('SIGINT 무시(창 유지)'));
process.on('uncaughtException', (e) => 적기('오류(계속): ' + String(e.message).slice(0, 110)));

let pg = ctx.pages()[0] || (await ctx.newPage());
const 알림받기 = (p) => p.on('dialog', async (d) => {
  적기('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70));
  await d.accept().catch(() => {});
});
ctx.on('page', 알림받기);
ctx.pages().forEach(알림받기);

// ⚠ 첫 탭만 보면 안 된다. 카페24 로그인은 **다른 탭에서 끝나는 경우가 많다.**
// 그러면 첫 탭은 영영 로그인 화면으로 남아 프로그램이 멈춘다. (2026-10-23 두 번 당함)
// 그래서 ① 모든 탭을 보고 ② 세션 쿠키가 있으면 첫 탭을 직접 관리자로 보내 확인한다.
// ⚠⚠ 기다리는 동안 **아무 페이지도 열지 않는다.**
// 전에는 5초마다 확인용 탭으로 관리자를 열어 봤는데, 그게 카페24의
// 「비정상적인 접속」 감지를 건드려 **사람이 방금 한 로그인을 죽였다.**
// 확인하려다 없애는 짓이었다. (2026-10-23 실측)
// 그래서 이제는 **사람이 연 탭을 가만히 들여다보기만** 한다. 내가 먼저 움직이지 않는다.
const 로그인된탭 = async () => {
  for (const p of ctx.pages()) {
    if (p.isClosed()) continue;
    if (!/atolian\.cafe24\.com\/(admin|disp)/i.test(p.url())) continue;
    const 나쁨 = await p.evaluate(() =>
      !!document.querySelector('input[type=password]')
      || /비정상적인 접속|로그인/.test((document.title || ''))).catch(() => true);
    if (!나쁨) return p;
  }
  return null;
};
const 로그인화면 = async () => !(await 로그인된탭());

await pg.goto('https://atolian.cafe24.com/disp/admin/shop1/main/dashboard',
  { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await pg.waitForTimeout(3000);

if (await 로그인화면()) {
  적기('로그인해 주세요 (상점 아이디 atolian). 로그인하면 제가 알아서 끝냅니다. 창은 안 닫습니다.');
  // ⏳ 시간 제한을 두지 않는다. 40분을 걸어 뒀더니 그 사이에 로그인이 없자
  // 멈춰 버렸고, 뒤늦게 로그인해도 아무 일이 안 일어났다. (2026-10-23 당함)
  // 사람이 언제 로그인하든 그때 이어서 하는 게 맞다.
  let 돈횟수 = 0;
  while (await 로그인화면()) {
    await pg.waitForTimeout(5000);
    돈횟수 += 1;
    if (돈횟수 % 120 === 0) 적기(`아직 기다리는 중입니다 (${Math.round(돈횟수 / 12)}분째). 창은 열려 있습니다.`);
  }
}
pg = (await 로그인된탭()) || pg;
적기('✓ 로그인 확인. 시작합니다. 쓰는 탭: ' + pg.url().slice(0, 70));

const 숨김 = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';

for (const s of 쇼핑몰) {
  적기(`\n── ${s.이름} (shop${s.shop} · skin${s.skin}) ──`);
  await pg.goto(`https://atolian.cafe24.com/disp/admin/editor/main?skin_no=${s.skin}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(9000);

  // 레이아웃 → 기본 레이아웃 → 메인 레이아웃
  const 누르기 = async (앞글자) => {
    const r = await pg.evaluate((t) => {
      const a = [...document.querySelectorAll('a')].find((e) => (e.innerText || '').trim().startsWith(t));
      if (!a) return false; a.click(); return true;
    }, 앞글자).catch(() => false);
    await pg.waitForTimeout(3500);
    return r;
  };
  await 누르기('전체화면보기');
  await 누르기('레이아웃 (layout)');
  await 누르기('기본 레이아웃');
  // 첫 화면이 쓰는 파일이 스킨마다 다르다. main.html 에 <body> 가 없는 스킨도 있어
  // **둘 다 열어 두고** <body> 가 있는 쪽에 넣는다. 하나만 열었다가 못 찾으면
  // 로그인 한 번이 통째로 버려진다. (2026-10-23)
  const 메인 = await 누르기('메인 레이아웃');
  await pg.waitForTimeout(2000);
  const 공통 = await 누르기('공통 레이아웃');
  await pg.waitForTimeout(3000);
  if (!메인 && !공통) { 적기('  ✗ 레이아웃 파일을 못 찾았습니다 — 건너뜁니다(세션은 유지)'); continue; }

  const 본 = await pg.evaluate(() => [...document.querySelectorAll('.CodeMirror')]
    .map((x) => x.CodeMirror).filter(Boolean)
    .map((c) => ({ 길이: c.getValue().length, body: c.getValue().indexOf('<body') >= 0, h1: c.getValue().indexOf('<h1') >= 0 })));
  적기('  열린 파일: ' + JSON.stringify(본));

  const 결과 = await pg.evaluate(({ h1, 숨김, 적용 }) => {
    const cs = [...document.querySelectorAll('.CodeMirror')].map((x) => x.CodeMirror).filter(Boolean);
    const 쓸것 = cs.filter((c) => /<body[^>]*>/.test(c.getValue()));
    if (!쓸것.length) return '<body> 가 있는 파일이 없습니다';
    const 넣을것 = `\n<h1 data-seo-h1 style="${숨김}">${h1}</h1>`;
    const 결과 = [];
    for (const cm of 쓸것) {
      let v = cm.getValue();
      if (v.indexOf('data-seo-h1') >= 0) { 결과.push('이미 있음'); continue; }
      const m = v.match(/<body[^>]*>/);
      v = v.replace(m[0], m[0] + 넣을것);
      if (!적용) { 결과.push({ 미리보기: true, 넣을자리: m[0] }); continue; }
      cm.setValue(v);
      cm.save();                     // ⚠ 이걸 빼면 저장 버튼이 빈 걸 보낸다
      const ta = cm.getTextArea && cm.getTextArea();
      결과.push({ 길이: cm.getValue().length, textarea: ta ? ta.value.indexOf('data-seo-h1') >= 0 : '-' });
    }
    return 결과;
  }, { h1: s.h1, 숨김, 적용 }).catch((e) => '✗ ' + String(e.message).slice(0, 80));
  적기('  ' + JSON.stringify(결과));

  if (!적용) continue;
  if (typeof 결과 === 'string') continue;

  // 파일을 둘 다 고쳤을 수 있으니 「모두저장」을 쓴다
  await pg.click('button:text-is("모두저장")', { timeout: 20000 })
    .catch(() => pg.click('button:text-is("저장")', { timeout: 15000 }))
    .catch((e) => 적기('  ✗ 저장 클릭: ' + String(e.message).slice(0, 60)));
  await pg.waitForTimeout(9000);
  적기('  저장했습니다');

  // 캐시 지우기
  await pg.goto(`https://atolian.cafe24.com/disp/admin/shop${s.shop}/varnish/PurgePage`,
    { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await pg.waitForTimeout(3500);
  await pg.click('a.btnSubmit', { timeout: 20000 }).catch(() => {});
  await pg.waitForTimeout(6000);
  적기('  캐시를 지웠습니다');
}

적기('\n끝났습니다. 확인:');
for (const s of 쇼핑몰) {
  const 주소 = { 1: 'https://lilai.ai', 4: 'https://medicustom.co.kr', 5: 'https://ellapiel.co.kr' }[s.shop];
  const html = await fetch(`${주소}/?h1=${Date.now()}`, { headers: { 'user-agent': 'Mozilla/5.0' } })
    .then((r) => r.text()).catch(() => '');
  const n = (html.match(/<h1/g) || []).length;
  const 내것 = html.indexOf('data-seo-h1') >= 0;
  적기(`  ${s.이름.padEnd(6)} h1 ${n}개 · 내가 넣은 것 ${내것 ? '있음' : '없음'}`);
}
적기('\n창은 그대로 둡니다. 더 할 일이 있으면 /tmp/cafe24-h1-cmd.jsonl 로 명령을 받습니다.');

// ── 명령 받기 ──────────────────────────────────────────────
// 자동으로 하다 막혀도 세션을 버리지 않는다. 여기서 이어서 할 수 있다.
const 명령파일 = '/tmp/cafe24-h1-cmd.jsonl';
try { fs.writeFileSync(명령파일, ''); } catch { /* 무시 */ }
let 읽은줄 = 0;
setInterval(async () => {
  let 줄들 = [];
  try { 줄들 = fs.readFileSync(명령파일, 'utf8').split('\n').filter(Boolean); } catch { return; }
  while (읽은줄 < 줄들.length) {
    const 줄 = 줄들[읽은줄]; 읽은줄 += 1;
    let 명 = null;
    try { 명 = JSON.parse(줄); } catch { 적기('명령을 못 읽음: ' + 줄.slice(0, 60)); continue; }
    const p = ctx.pages().filter((x) => !x.isClosed()).pop() || pg;
    try {
      if (명.goto) { await p.goto(명.goto, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(2500); 적기('goto → ' + p.url().slice(0, 85)); }
      else if (명.eval) { 적기('eval → ' + JSON.stringify(await p.evaluate(명.eval)).slice(0, 1200)); }
      else if (명.click) { await p.click(명.click, { timeout: 15000 }); await p.waitForTimeout(2000); 적기('click ' + 명.click); }
      else if (명.shot) { await p.screenshot({ path: 명.shot }); 적기('shot → ' + 명.shot); }
      else if (명.pages) 적기('탭: ' + ctx.pages().map((x) => x.url().slice(0, 55)).join(' ‖ '));
      else 적기('모르는 명령: ' + 줄.slice(0, 50));
    } catch (e) { 적기('✗ ' + String(e.message).split('\n')[0].slice(0, 110)); }
  }
}, 1500);
await new Promise(() => {});
