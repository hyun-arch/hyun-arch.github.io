#!/usr/bin/env node
// 네이버 임시저장 글을 지운다.
//   node publish/draft-delete.mjs "18:51"        그 시각 글을 지운다
//   node publish/draft-delete.mjs --오래된것만     가장 오래된 것 하나만
//
// 길 (2026-10-22 실측):
//   「저장」 글자 버튼이 아니라 **그 옆 숫자 뱃지**를 눌러야 목록이 열린다.
//   영역 클래스는 .save_btn_area__Za8Iv — 그 오른쪽 끝을 누른다.
//   목록이 열리면 오른쪽 위 「편집」 → 각 줄에 삭제가 생긴다.
import { openBrowser } from './naver-open.mjs';

const 찾을것 = process.argv.find((a) => /^\d{2}:\d{2}$/.test(a));
const 오래된것 = process.argv.includes('--오래된것만');

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { console.log('  알림:', d.message().slice(0, 40)); await d.accept().catch(() => {}); });
try {
  await pg.goto('https://blog.naver.com/ianlove80/postwrite', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(12000);
  // 「작성 중인 글」 팝업은 **본문 iframe 안**에 있다. pg.locator 로는 안 잡힌다. (2026-10-23 실측)
  const 프레임 = () => pg.frames().find((x) => /postwrite/i.test(x.url())) || pg.mainFrame();
  for (let i = 0; i < 5; i++) {
    const 닫음 = await 프레임().evaluate(() => {
      const b = [...document.querySelectorAll('button,a')]
        .find((e) => /^(취소|닫기)$/.test((e.innerText || '').trim()) && e.offsetParent);
      if (!b) return false;
      b.click(); return true;
    }).catch(() => false);
    if (!닫음) break;
    await pg.waitForTimeout(2000);
  }
  // 도움말/딤도 치운다
  await 프레임().evaluate(() => {
    document.querySelectorAll('.se-popup-dim, [class*="dim"]').forEach((e) => (e.style.display = 'none'));
  }).catch(() => {});
  await pg.waitForTimeout(1500);
  const f = 프레임();

  // 숫자 뱃지를 눌러 목록을 연다
  const pos = await f.evaluate(() => {
    const a = document.querySelector('.save_btn_area__Za8Iv');
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return { x: Math.round(r.right - 12), y: Math.round(r.y + r.height / 2) };
  });
  if (!pos) {
    // 클래스가 바뀌었을 수 있다 — 「저장」 글자 옆 숫자 자리를 좌표로 친다
    const alt = await f.evaluate(() => {
      const b = [...document.querySelectorAll('button')]
        .find((e) => /^저장(\s*\d+)?$/.test((e.innerText || '').trim()));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.right + 22), y: Math.round(r.y + r.height / 2) };
    });
    if (!alt) throw new Error('저장 버튼을 못 찾았습니다');
    await pg.mouse.click(alt.x, alt.y);
    await pg.waitForTimeout(4000);
  } else {
    await pg.mouse.click(pos.x, pos.y);
    await pg.waitForTimeout(4000);
  }

  // 「편집」 을 눌러 삭제 모드로
  const 편집 = await f.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].find((e) => (e.innerText || '').trim() === '편집');
    if (!b) return false;
    b.click(); return true;
  });
  console.log('편집 모드:', 편집);
  await pg.waitForTimeout(2500);

  const 목록 = await f.evaluate(() => {
    const rows = [...document.querySelectorAll('li, [class*="item"]')]
      .filter((e) => /간호사|맞춤형|\d{4}\.\d{2}\.\d{2}/.test(e.innerText || ''));
    return rows.map((e) => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 60));
  });
  console.log('목록:', JSON.stringify(목록.slice(0, 5), null, 1));
  await pg.screenshot({ path: '/tmp/draft-edit.png' });

  // 대상 줄의 체크박스/삭제를 누른다
  const 지움 = await f.evaluate(({ 찾을것, 오래된것 }) => {
    const rows = [...document.querySelectorAll('li, [class*="item"]')]
      .filter((e) => /\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/.test(e.innerText || ''));
    if (!rows.length) return '줄을 못 찾음';
    let t = null;
    if (찾을것) t = rows.find((e) => (e.innerText || '').includes(찾을것));
    else if (오래된것) t = rows[rows.length - 1];
    if (!t) return '대상 없음';
    const cb = t.querySelector('input[type=checkbox]');
    if (cb) { cb.click(); return '체크함'; }
    const del = [...t.querySelectorAll('button,a,span')].find((e) => /삭제/.test(e.innerText || ''));
    if (del) { del.click(); return '삭제 누름'; }
    return '체크박스도 삭제도 없음';
  }, { 찾을것, 오래된것 });
  console.log('대상 처리:', 지움);
  await pg.waitForTimeout(2000);

  // 삭제 확정 — 버튼 이름은 「선택 삭제」다. 「전체 삭제」를 누르면 다 날아간다. (2026-10-22 실측)
  const 눌림 = await f.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .find((e) => (e.innerText || '').trim() === '선택 삭제');
    if (!b) return false;
    b.click(); return true;
  });
  console.log('선택 삭제:', 눌림);
  await pg.waitForTimeout(3000);
  // 확인 창
  await f.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .find((e) => /^(삭제|확인)$/.test((e.innerText || '').trim()));
    b && b.click();
  });
  await pg.waitForTimeout(5000);
  await pg.screenshot({ path: '/tmp/draft-after.png' });
} finally { await ctx.close().catch(() => {}); }
