#!/usr/bin/env node
// 네이버 발행 레이어의 **예약 발행** 칸이 어떻게 생겼는지 본다.
//   NAVER_HEADLESS=0 node publish/probe-reserve.mjs
//
// 글을 올리지 않는다. 레이어만 열어 모양을 적고 닫는다.
import { openBrowser } from './naver-open.mjs';

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { console.log('알림:', d.message().slice(0, 50)); await d.accept().catch(() => {}); });

await pg.goto('https://blog.naver.com/ianlove80/postwrite', { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(12000);

const 프레임 = () => pg.frames().find((x) => /postwrite|PostWriteForm/i.test(x.url())) || pg.mainFrame();
// 「작성 중인 글」 팝업 닫기
for (let i = 0; i < 5; i += 1) {
  const c = await 프레임().evaluate(() => {
    const b = [...document.querySelectorAll('button,a')]
      .find((e) => /^(취소|닫기)$/.test((e.innerText || '').trim()) && e.offsetParent);
    if (!b) return false; b.click(); return true;
  }).catch(() => false);
  if (!c) break;
  await pg.waitForTimeout(2000);
}
const f = 프레임();

// 발행이 가능하려면 제목·본문이 있어야 한다. 아주 짧게 넣는다 (발행하지 않는다)
await f.locator('.se-documentTitle [contenteditable="true"], [contenteditable="true"]').first()
  .click({ timeout: 15000 }).catch(() => {});
await pg.keyboard.type('예약칸 확인용', { delay: 10 });
await pg.waitForTimeout(800);
const 본문 = f.locator('.se-main-container [contenteditable="true"], [contenteditable="true"]').last();
await 본문.click().catch(() => {});
await pg.keyboard.type('예약 발행 칸 모양만 봅니다.', { delay: 8 });
await pg.waitForTimeout(1200);

await f.locator('button[data-click-area="tpb.publish"]').first().click({ timeout: 20000 });
await pg.waitForTimeout(2500);

// 「예약」을 누르고 나타나는 칸을 본다
const 전 = await f.evaluate(() => {
  const 레이어 = [...document.querySelectorAll('div, section, form')]
    .filter((e) => /공개 설정/.test(e.innerText || '') && /발행 시간/.test(e.innerText || ''))
    .sort((a, b) => a.innerText.length - b.innerText.length)[0];
  if (!레이어) return '레이어 못 찾음';
  const 라디오 = [...레이어.querySelectorAll('input[type=radio], label, button')]
    .filter((e) => /현재|예약/.test(e.innerText || e.value || ''))
    .map((e) => ({ t: e.tagName, 글: (e.innerText || '').trim().slice(0, 10), id: e.id, cls: String(e.className).slice(0, 36) }));
  return { 라디오 };
});
console.log('누르기 전:', JSON.stringify(전, null, 1));

// 라디오는 id 로 직접 누른다 — 글자로 찾으면 안 눌린다 (2026-10-23 실측)
await f.locator('#radio_time2').click({ force: true, timeout: 10000 }).catch(async () => {
  await f.evaluate(() => { const r = document.querySelector('#radio_time2'); if (r) { r.click(); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } });
});
await pg.waitForTimeout(2500);

const 후 = await f.evaluate(() => {
  const 레이어 = [...document.querySelectorAll('div, section, form')]
    .filter((e) => /공개 설정/.test(e.innerText || '') && /발행 시간/.test(e.innerText || ''))
    .sort((a, b) => a.innerText.length - b.innerText.length)[0];
  if (!레이어) return '레이어 못 찾음';
  return {
    글: (레이어.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
    날짜영역: (() => {
      const d = 레이어.querySelector('[class*="date__"]');
      if (!d) return '없음';
      return { html: d.outerHTML.slice(0, 900) };
    })(),
    예약칸: [...레이어.querySelectorAll('select, input[type=text], input[type=date], [class*="date"], [class*="calendar"]')]
      .filter((e) => e.offsetParent)
      .map((e) => ({ t: e.tagName, type: e.type || '', id: e.id, name: e.name,
                     cls: String(e.className).slice(0, 44), 값: String(e.value || '').slice(0, 20),
                     옵션: e.tagName === 'SELECT' ? [...e.options].slice(0, 3).map((o) => o.value).join(',') + '…' : '' })),
    입력칸: [...레이어.querySelectorAll('input, select')].map((e) => ({
      t: e.tagName, type: e.type, name: e.name, id: e.id,
      cls: String(e.className).slice(0, 40), 값: String(e.value).slice(0, 24),
      보임: !!e.offsetParent,
    })),
  };
});
console.log('\n예약 누른 뒤:', JSON.stringify(후, null, 1));

await pg.screenshot({ path: '/tmp/reserve.png' });
console.log('\n화면: /tmp/reserve.png');
console.log('글은 올리지 않았습니다. 창을 닫습니다.');
await ctx.close().catch(() => {});
