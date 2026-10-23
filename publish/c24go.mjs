#!/usr/bin/env node
// 이미 로그인된 카페24 창을 **붙잡아** H1 을 넣는다.
//
// 왜 따로 만들었나 (2026-10-23) —
//   관리자 창은 이미 로그인돼 있는데, 내 탐지가 광고 팝업·알림 때문에 못 알아봤다.
//   화면을 찍어 보니 대시보드가 멀쩡히 떠 있었다. **보지도 않고 「로그인 안 됐다」고 했다.**
//   그래서 이번엔 탐지를 빼고 **바로 일을 시작**한다. 창은 어떤 경우에도 안 닫는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const 기록 = '/tmp/c24go.log';
const 적기 = (s) => { const l = `[${new Date().toTimeString().slice(0, 8)}] ${s}\n`; fs.appendFileSync(기록, l); process.stdout.write(l); };
fs.writeFileSync(기록, '');

const 숨김 = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap';
const 쇼핑몰 = [
  { shop: 1, skin: 28, 이름: '릴라이',     사이트: 'https://lilai.ai',          h1: '릴라이 — 두피를 측정해 찾는 1:1 맞춤 샴푸' },
  { shop: 4, skin: 21, 이름: '메디커스텀', 사이트: 'https://medicustom.co.kr', h1: '메디커스텀 — 자주 씻는 손을 위해 측정으로 설계한 핸드크림' },
  { shop: 5, skin: 26, 이름: '엘라피엘',   사이트: 'https://ellapiel.co.kr',   h1: '엘라피엘 — 피부를 측정해 모자란 것부터 채우는 스킨케어' },
];

const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-site'), {
  headless: false, viewport: { width: 1480, height: 920 },
  args: ['--disable-blink-features=AutomationControlled'],
});
process.on('SIGTERM', () => 적기('SIGTERM 무시'));
process.on('SIGINT', () => 적기('SIGINT 무시'));
process.on('uncaughtException', (e) => 적기('오류(계속): ' + String(e.message).slice(0, 110)));

const pg = ctx.pages()[0] || (await ctx.newPage());
const 알림받기 = (p) => p.on('dialog', async (d) => {
  적기('알림: ' + d.message().replace(/\s+/g, ' ').slice(0, 60));
  await d.accept().catch(() => {});
});
ctx.on('page', 알림받기); ctx.pages().forEach(알림받기);

for (const s of 쇼핑몰) {
  적기(`\n── ${s.이름} (shop${s.shop} · skin${s.skin}) ──`);
  await pg.goto(`https://atolian.cafe24.com/disp/admin/editor/main?skin_no=${s.skin}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(10000);

  if (/eclogin/i.test(pg.url())) { 적기('  ✗ 로그인 화면으로 튕겼습니다 — 건너뜁니다'); continue; }

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
  const 메인 = await 누르기('메인 레이아웃');
  await pg.waitForTimeout(2000);
  const 공통 = await 누르기('공통 레이아웃');
  await pg.waitForTimeout(3000);
  if (!메인 && !공통) { 적기('  ✗ 레이아웃 파일을 못 찾았습니다'); continue; }

  const 결과 = await pg.evaluate(({ h1, 숨김 }) => {
    const cs = [...document.querySelectorAll('.CodeMirror')].map((x) => x.CodeMirror).filter(Boolean);
    const 쓸것 = cs.filter((c) => /<body[^>]*>/.test(c.getValue()));
    if (!쓸것.length) return ['<body> 가 있는 파일이 없습니다'];
    const 넣을것 = `\n<h1 data-seo-h1 style="${숨김}">${h1}</h1>`;
    const 결 = [];
    for (const cm of 쓸것) {
      let v = cm.getValue();
      if (v.indexOf('data-seo-h1') >= 0) { 결.push('이미 있음'); continue; }
      const m = v.match(/<body[^>]*>/);
      cm.setValue(v.replace(m[0], m[0] + 넣을것));
      cm.save();                          // ⚠ 이걸 빼면 저장 버튼이 빈 걸 보낸다
      const ta = cm.getTextArea && cm.getTextArea();
      결.push({ 길이: cm.getValue().length, textarea: ta ? ta.value.indexOf('data-seo-h1') >= 0 : '-' });
    }
    return 결;
  }, { h1: s.h1, 숨김 }).catch((e) => ['✗ ' + String(e.message).slice(0, 80)]);
  적기('  넣기: ' + JSON.stringify(결과));

  await pg.click('button:text-is("모두저장")', { timeout: 20000 })
    .catch(() => pg.click('button:text-is("저장")', { timeout: 15000 }))
    .catch((e) => 적기('  ✗ 저장: ' + String(e.message).slice(0, 60)));
  await pg.waitForTimeout(9000);
  적기('  저장했습니다');

  await pg.goto(`https://atolian.cafe24.com/disp/admin/shop${s.shop}/varnish/PurgePage`,
    { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await pg.waitForTimeout(4000);
  await pg.click('a.btnSubmit', { timeout: 20000 }).catch(() => {});
  await pg.waitForTimeout(7000);
  적기('  캐시를 지웠습니다');
}

적기('\n확인:');
for (const s of 쇼핑몰) {
  const html = await fetch(`${s.사이트}/?h1=${Date.now()}`, { headers: { 'user-agent': 'Mozilla/5.0' } })
    .then((r) => r.text()).catch(() => '');
  적기(`  ${s.이름.padEnd(6)} h1 ${(html.match(/<h1/g) || []).length}개 · 내가 넣은 것 ${html.indexOf('data-seo-h1') >= 0 ? '있음' : '없음'}`);
}
적기('끝. 창은 그대로 둡니다.');
await new Promise(() => {});
