#!/usr/bin/env node
// 카페24 관리자 창을 **한 번만** 띄우고, 그 창을 파일로 조종한다.
//
//   node publish/cafe24-shell.mjs          (띄우고 계속 떠 있는다)
//   명령 넣기:  echo '{"goto":"..."}'  >> /tmp/cafe24-cmd.jsonl
//   결과 보기:  tail /tmp/cafe24-out.log
//
// 왜 이렇게까지 하나 (2026-10-23) —
//   카페24 관리자는 **브라우저를 다시 띄우면 세션을 죽인다.**
//     "Session이 종료되었거나, 비정상적인 접속입니다."
//   그래서 로그인한 창을 한 번이라도 닫으면 로그인이 헛일이 된다.
//   확인하려고 두 번 닫았다가 두 번 날렸다. 사람에게 세 번 로그인하게 할 수는 없다.
//   창을 띄운 프로그램이 **계속 살아서** 명령을 받아 처리하면 닫을 일이 없다.
//
// 넣을 수 있는 명령 (한 줄에 하나, JSON):
//   {"goto":"주소"}                        그 주소로 간다
//   {"eval":"자바스크립트"}                  지금 페이지에서 돌린다 (결과를 적는다)
//   {"click":"선택자"}  {"fill":["선택자","글자"]}
//   {"shot":"/tmp/어디.png"}               화면을 찍는다
//   {"pages":1}                            열린 탭 목록
//   {"frames":1}                           프레임 목록
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const 명령파일 = '/tmp/cafe24-cmd.jsonl';
const 기록파일 = '/tmp/cafe24-out.log';
const 관리자 = 'https://atolian.cafe24.com/admin/php/main.php';

const 적기 = (s) => {
  const 줄 = `[${new Date().toTimeString().slice(0, 8)}] ${s}\n`;
  fs.appendFileSync(기록파일, 줄);
  process.stdout.write(줄);
};

fs.writeFileSync(기록파일, '');
fs.writeFileSync(명령파일, '');

const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-site'), {
  headless: false,
  viewport: { width: 1480, height: 920 },
  args: ['--disable-blink-features=AutomationControlled'],
});
// 어떤 신호를 받아도 **창을 닫지 않는다**. 닫으면 세션이 죽는다.
process.on('SIGTERM', () => 적기('SIGTERM 받았지만 창은 안 닫습니다'));
process.on('SIGINT', () => 적기('SIGINT 받았지만 창은 안 닫습니다'));
process.on('uncaughtException', (e) => 적기('오류(계속 돕니다): ' + String(e.message).slice(0, 120)));

const pg0 = ctx.pages()[0] || (await ctx.newPage());
await pg0.goto(관리자, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
ctx.on('page', (p) => p.on('dialog', async (d) => {
  적기('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70));
  await d.accept().catch(() => {});
}));
for (const p of ctx.pages()) {
  p.on('dialog', async (d) => {
    적기('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 70));
    await d.accept().catch(() => {});
  });
}

적기('창을 띄웠습니다. 로그인해 주세요 (상점 아이디 atolian). 창은 제가 닫지 않습니다.');

// 로그인이 끝났는지 — 모든 탭을 본다
const 지금페이지 = () => {
  const ps = ctx.pages().filter((p) => !p.isClosed());
  return ps[ps.length - 1] || pg0;
};
const 로그인됐나 = async () => {
  for (const p of ctx.pages()) {
    if (p.isClosed()) continue;
    if (!/atolian\.cafe24\.com\/(admin|disp)/i.test(p.url())) continue;
    const 비번 = await p.evaluate(() => !!document.querySelector('input[type=password]')).catch(() => true);
    const 알림 = await p.evaluate(() => /비정상적인 접속/.test(document.body.innerText || '')).catch(() => false);
    if (!비번 && !알림) return p;
  }
  return null;
};

let 알렸나 = false;
setInterval(async () => {
  const p = await 로그인됐나();
  if (p && !알렸나) { 알렸나 = true; 적기('✓ 로그인 확인 — 이제 명령을 받습니다. 지금 주소: ' + p.url().slice(0, 80)); }
}, 4000);

// 명령 파일을 지켜본다
let 읽은줄 = 0;
setInterval(async () => {
  let 줄들 = [];
  try { 줄들 = fs.readFileSync(명령파일, 'utf8').split('\n').filter(Boolean); } catch { return; }
  while (읽은줄 < 줄들.length) {
    const 줄 = 줄들[읽은줄]; 읽은줄 += 1;
    let 명 = null;
    try { 명 = JSON.parse(줄); } catch { 적기('명령을 못 읽었습니다: ' + 줄.slice(0, 60)); continue; }
    const p = 지금페이지();
    try {
      if (명.goto) { await p.goto(명.goto, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(2500); 적기('goto → ' + p.url().slice(0, 90)); }
      else if (명.eval) { const r = await p.evaluate(명.eval); 적기('eval → ' + JSON.stringify(r).slice(0, 1500)); }
      else if (명.click) { await p.click(명.click, { timeout: 15000 }); await p.waitForTimeout(2000); 적기('click ' + 명.click + ' → ' + p.url().slice(0, 70)); }
      else if (명.fill) { await p.fill(명.fill[0], 명.fill[1], { timeout: 15000 }); 적기('fill ' + 명.fill[0]); }
      else if (명.shot) { await p.screenshot({ path: 명.shot }); 적기('shot → ' + 명.shot); }
      else if (명.pages) 적기('탭 ' + ctx.pages().length + '개: ' + ctx.pages().map((x) => x.url().slice(0, 60)).join(' ‖ '));
      else if (명.frames) 적기('프레임: ' + p.frames().map((f) => f.url().slice(0, 70)).join(' ‖ '));
      else 적기('모르는 명령: ' + 줄.slice(0, 60));
    } catch (e) { 적기('✗ ' + String(e.message).split('\n')[0].slice(0, 120)); }
  }
}, 1500);
