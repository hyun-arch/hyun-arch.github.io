#!/usr/bin/env node
// 인스타그램 웹에 글을 올린다. web-login.mjs 로 로그인해 둔 전용 브라우저를 쓴다.
//   node publish/ig-web-post.mjs <이미지> <본문파일>
// 마지막 「공유하기」까지 누르고, 안 되면 창을 열어 둔 채 멈춘다.
import fs from 'node:fs';
import { openSns } from './web-login.mjs';

const [img, textFile] = process.argv.slice(2);
const caption = fs.readFileSync(textFile, 'utf8').trim();
const SHOT = '/tmp/ig';

const ctx = await openSns();
const pg = ctx.pages()[0] || (await ctx.newPage());
try {
  await pg.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(6000);
  if (/accounts\/login/.test(pg.url())) throw new Error('로그인이 안 돼 있습니다');

  // 만들기 — aria-label 로 찾아 가장 가까운 클릭 가능한 조상을 누른다
  const chooser = pg.waitForEvent('filechooser', { timeout: 40000 }).catch(() => null);
  await pg.evaluate(() => {
    const s = [...document.querySelectorAll('svg[aria-label]')]
      .find(e => /만들기|새 게시물|New post|Create/i.test(e.getAttribute('aria-label')));
    let e = s;
    while (e && !['A','BUTTON'].includes(e.tagName) && e.getAttribute?.('role') !== 'link'
           && e.getAttribute?.('role') !== 'button') e = e.parentElement;
    (e || s).click();
  });
  await pg.waitForTimeout(3500);
  await pg.screenshot({ path: SHOT + '1.png' });

  // 「컴퓨터에서 선택」 — 없으면 게시물 메뉴를 한 번 더
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,div[role="button"],span')]
      .find(e => /컴퓨터에서 선택|Select from computer/i.test(e.innerText||''));
    if (b) { b.click(); return; }
    const p = [...document.querySelectorAll('span,div')]
      .find(e => /^(게시물|Post)$/.test((e.innerText||'').trim()));
    p && p.click();
  });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,div[role="button"]')]
      .find(e => /컴퓨터에서 선택|Select from computer/i.test(e.innerText||''));
    b && b.click();
  });

  const fc = await chooser;
  if (!fc) { await pg.screenshot({ path: SHOT + '_nofile.png' }); throw new Error('파일 선택창이 안 열림'); }
  await fc.setFiles(img);
  await pg.waitForTimeout(7000);
  await pg.screenshot({ path: SHOT + '2.png' });

  // 자르기/필터 → 다음 2번
  for (let i = 0; i < 2; i++) {
    await pg.evaluate(() => {
      const b = [...document.querySelectorAll('div[role="button"],button')]
        .find(e => /^(다음|Next)$/.test((e.innerText||'').trim()));
      b && b.click();
    });
    await pg.waitForTimeout(3500);
  }
  await pg.screenshot({ path: SHOT + '3.png' });

  // 문구
  const box = pg.locator('div[contenteditable="true"]').first();
  await box.click({ timeout: 20000 });
  await pg.keyboard.insertText(caption);
  await pg.waitForTimeout(2500);
  const len = await box.innerText().then(t => t.length).catch(() => 0);
  console.log('문구 입력:', len, '자');
  await pg.screenshot({ path: SHOT + '4.png' });

  // 공유하기
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('div[role="button"],button')]
      .find(e => /^(공유하기|Share)$/.test((e.innerText||'').trim()));
    b && b.click();
  });
  await pg.waitForTimeout(15000);
  await pg.screenshot({ path: SHOT + '5.png' });

  const done = await pg.evaluate(() =>
    /게시물이 공유되었습니다|Your post has been shared/i.test(document.body.innerText||''));
  console.log(done ? '✓ 공유 완료' : '△ 확인 필요 — 창을 열어 둡니다');
  if (!done) await new Promise(r => ctx.on('close', r));
} catch (e) {
  console.log('멈춤:', e.message.split('\n')[0], '— 창을 열어 둡니다');
  await new Promise(r => ctx.on('close', r));
}
