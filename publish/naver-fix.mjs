#!/usr/bin/env node
// 이미 발행된 네이버 글에서 **한 문단을 찾아 바꾼다**.
//
//   NAVER_HEADLESS=0 node publish/naver-fix.mjs 224450821499 \
//     --찾기 "atolian" --바꾸기 "릴라이 공식몰 → lilai.ai|https://lilai.ai"
//   node publish/naver-fix.mjs 224450821499 --찾기 "atolian" --보기만
//
// 왜 만들었나 —
//   발행 뒤에 틀린 게 나오면 글을 지우고 다시 올리는 수밖에 없었다.
//   주소 하나 때문에 글의 URL 과 그동안 쌓인 조회를 버릴 수는 없다.
//
// 어떻게 바꾸나 —
//   DOM 을 직접 건드리면 스마트에디터의 내부 모델이 안 따라와 저장 때 되돌아간다.
//   그래서 사람이 하듯 **세 번 클릭해 문단을 통째로 고르고 다시 친다**.
//   「|」로 나누면 여러 문단으로 들어간다(주소는 홀로 있어야 네이버가 링크를 건다).
import { openBrowser } from './naver-open.mjs';

const args = process.argv.slice(2);
const 옵션 = (이름, 기본) => (args.includes(이름) ? args[args.indexOf(이름) + 1] : 기본);
const id = args.find((a) => /^\d{9,}$/.test(a));
const 찾기 = 옵션('--찾기', '');
const 다시쓰기 = 옵션('--다시쓰기', '');   // 글폴더 — 본문을 통째로 다시 쓴다
const 청소 = args.includes('--청소');        // 마크다운 찌꺼기(## · ** · [x](y))만 문단째 고쳐 쓴다
const 바꾸기 = 옵션('--바꾸기', '');
const 보기만 = args.includes('--보기만');
const blogId = 옵션('--blog', 'ianlove80');
if (!id || (!찾기 && !다시쓰기 && !청소)) {
  console.log('쓰는 법: node publish/naver-fix.mjs <글ID> --찾기 "글자" [--바꾸기 "새 문단|둘째 문단"] [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --다시쓰기 naver-blog/posts/<글폴더> [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --청소 [--보기만]');
  process.exit(1);
}

const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
pg.on('dialog', async (d) => { console.log('  알림:', d.message().slice(0, 50)); await d.accept().catch(() => {}); });

await pg.goto(`https://blog.naver.com/PostWriteForm.naver?blogId=${blogId}&Redirect=Update&logNo=${id}`,
  { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(12000);

const 프레임 = () => pg.frames().find((x) => /PostWriteForm|postwrite/i.test(x.url())) || pg.mainFrame();

// 「작성 중인 글」 팝업은 본문 iframe 안에 있다. 페이지 수준 선택자로는 안 잡힌다.
for (let i = 0; i < 5; i++) {
  const 닫음 = await 프레임().evaluate(() => {
    const b = [...document.querySelectorAll('button,a')]
      .find((e) => /^(취소|닫기)$/.test((e.innerText || '').trim()) && e.offsetParent);
    if (!b) return false; b.click(); return true;
  }).catch(() => false);
  if (!닫음) break;
  await pg.waitForTimeout(2000);
}
await 프레임().evaluate(() => {
  document.querySelectorAll('.se-popup-dim, [class*="popup-dim"]').forEach((e) => (e.style.display = 'none'));
}).catch(() => {});
await pg.waitForTimeout(1500);

const f = 프레임();

// ── 마크다운 찌꺼기만 문단째 고쳐 쓰기 ────────────────────────
// 왜 이렇게 하나: 수정 화면에서는 스마트에디터가 선택을 숨은 입력 버퍼로 가져가서
// window.getSelection() 이 늘 비어 있다. Cmd+A 로 본문만 골랐는지 확인할 방법이 없어
// 「전체 지우고 다시 쓰기」는 제목까지 날릴 위험이 있다.
// 그래서 **찌꺼기가 든 문단만** 세 번 클릭으로 골라 다시 친다. (2026-10-23)
if (청소) {
  const 씻기 = (t) => t
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 $2')   // [이름](주소) → 이름 주소
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*]\s+/, '· ')                                  // - 목록 → · (변환기와 같은 모양)
    .replace(/atolian\.cafe24\.com/g, 'lilai.ai')
    .replace(/\s+/g, ' ')
    .trim();

  for (let 회 = 0; 회 < 40; 회 += 1) {
    const 대상 = await f.evaluate(() => {
      const ps = [...document.querySelectorAll('.se-text-paragraph')];
      const i = ps.findIndex((p) => /\*\*|^#{1,6}\s|^[-*]\s|atolian|\]\(http/.test((p.innerText || '').trim()));
      if (i < 0) return null;
      const r = ps[i].getBoundingClientRect();
      return { 번호: i, 글: (ps[i].innerText || '').trim(),
               x: Math.round(r.x + Math.min(r.width / 2, 100)), y: Math.round(r.y + r.height / 2),
               보이나: r.height > 0 && r.y > 60 && r.y < 760 };
    });
    if (!대상) { console.log(`  찌꺼기 문단 없음 — ${회}개 고쳤습니다`); break; }

    const 새글 = 씻기(대상.글);
    if (보기만) { console.log(`   ${대상.번호}: ${대상.글.slice(0,70)}\n      → ${새글.slice(0,70)}`); 
      // 보기만일 때는 한 번 보고 끝낸다 (고치지 않으니 무한반복이 된다)
      const 전부 = await f.evaluate(() => [...document.querySelectorAll('.se-text-paragraph')]
        .map((p, i) => [i, (p.innerText || '').trim()])
        .filter(([, t]) => /\*\*|^#{1,6}\s|^[-*]\s|atolian|\]\(http/.test(t)));
      전부.forEach(([i, t]) => console.log(`   ${i}: ${t.slice(0, 80)}`));
      console.log(`\n  고칠 문단 ${전부.length}개. 실제로 고치려면 --보기만 을 빼세요.`);
      await ctx.close().catch(() => {});
      process.exit(0);
    }

    if (!대상.보이나) {
      await f.evaluate((i) => document.querySelectorAll('.se-text-paragraph')[i]
        ?.scrollIntoView({ block: 'center' }), 대상.번호);
      await pg.waitForTimeout(800);
      continue;
    }

    await pg.mouse.click(대상.x, 대상.y, { clickCount: 3 });
    await pg.waitForTimeout(500);
    await pg.keyboard.type(새글, { delay: 7 });
    await pg.waitForTimeout(700);

    const 됐나 = await f.evaluate(({ i, 새글 }) => {
      const t = (document.querySelectorAll('.se-text-paragraph')[i]?.innerText || '').trim();
      return { 지금: t, 깨끗: !/\*\*|^#{1,6}\s|^[-*]\s|atolian|\]\(http/.test(t) };
    }, { i: 대상.번호, 새글 });
    console.log(`   ${대상.번호} → ${됐나.지금.slice(0, 60)}${됐나.깨끗 ? '' : '  ⚠ 아직 찌꺼기'}`);
    if (!됐나.깨끗) {
      await pg.screenshot({ path: '/tmp/naver-fix.png' });
      throw new Error(`문단 ${대상.번호} 가 안 고쳐집니다 — 발행하지 않고 멈춥니다. 화면: /tmp/naver-fix.png`);
    }
  }

  const 점검 = await f.evaluate(() => {
    const t = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
    return { 샵: (t.match(/^#{1,6}\s/gm) || []).length, 별표: (t.match(/\*\*/g) || []).length,
             atolian: (t.match(/atolian/g) || []).length, 길이: t.length };
  });
  console.log(`  고친 뒤 — ## ${점검.샵} · ** ${점검.별표} · atolian ${점검.atolian} · ${점검.길이}자`);
  if (점검.샵 || 점검.별표 || 점검.atolian) {
    await pg.screenshot({ path: '/tmp/naver-fix.png' });
    throw new Error('찌꺼기가 남았습니다 — 발행하지 않고 멈춥니다. 화면: /tmp/naver-fix.png');
  }

  const 누르기 = async (area, timeout = 20000) => {
    const b = f.locator(`button[data-click-area="${area}"]`).first();
    await b.waitFor({ state: 'visible', timeout });
    await b.click({ timeout: 8000 });
  };
  await 누르기('tpb.publish');
  await pg.waitForTimeout(1500);
  try { await 누르기('tpb*i.publish', 20000); }
  catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
  await pg.waitForTimeout(6000);
  const 주소 = pg.url();
  if (/PostWriteForm|postwrite/i.test(주소)) {
    await pg.screenshot({ path: '/tmp/naver-fix.png' });
    throw new Error('발행 확인이 안 됩니다. 화면: /tmp/naver-fix.png');
  }
  console.log('  ✓ 고쳐 발행했습니다 →', 주소);
  await ctx.close().catch(() => {});
  process.exit(0);
}

// ── 본문 통째로 다시 쓰기 ──────────────────────────────────────
// 왜 필요했나: 「지성 두피」 글이 변환기를 안 거치고 올라가
// 본문에 ## 과 ** 가 그대로 박혀 있었다. 한 문단만 고쳐서는 안 됐다. (2026-10-23)
if (다시쓰기) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { toNaver } = await import('../naver-blog/lib/tonaver.mjs');
  const 원고 = path.resolve(다시쓰기, 'post.md');
  if (!fs.existsSync(원고)) throw new Error('원고가 없습니다: ' + 원고);
  const { blocks } = toNaver(fs.readFileSync(원고, 'utf8'));
  console.log(`  원고 ${path.basename(다시쓰기)} → 블록 ${blocks.length}개`);

  if (보기만) {
    blocks.forEach((b, i) => console.log(`   ${i} ${b.type} ${(b.text || b.path || '').slice(0, 70).replace(/\n/g, ' ⏎ ')}`));
    await ctx.close().catch(() => {});
    process.exit(0);
  }

  const 본문 = f.locator('.se-main-container [contenteditable="true"]').last();
  await 본문.click({ timeout: 15000 });
  await pg.keyboard.press('Meta+a');
  await pg.waitForTimeout(400);
  // 제목까지 잡혔으면 사고다 — 제목이 사라지면 글이 망가진다
  const 제목살아있나 = await f.evaluate(() =>
    (document.querySelector('.se-title-text, .se-documentTitle')?.innerText || '').trim().length > 3);
  if (!제목살아있나) throw new Error('제목이 안 보입니다 — 선택 범위가 이상해 멈춥니다');
  await pg.keyboard.press('Backspace');
  await pg.waitForTimeout(800);

  const addPhoto = async (filePath) => {
    const { execFileSync } = await import('node:child_process');
    execFileSync('osascript', ['-e',
      `set the clipboard to (read (POSIX file "${filePath.replace(/"/g, '\\"')}") as «class PNGf»)`]);
    await 본문.click().catch(() => {});
    await pg.keyboard.press('End').catch(() => {});
    await pg.keyboard.press('Meta+v');
    await pg.waitForTimeout(7000);
    await 본문.click().catch(() => {});
    await pg.keyboard.press('End').catch(() => {});
    await pg.keyboard.press('Enter').catch(() => {});
  };

  for (const [i, b] of blocks.entries()) {
    if (b.type === 'image') { await addPhoto(b.path); continue; }
    if (i > 0 && blocks[i - 1].type === 'text') await pg.keyboard.press('Enter');
    for (const 줄 of String(b.text || '').split('\n')) {
      await pg.keyboard.type(줄, { delay: 6 });
      await pg.keyboard.press('Enter');
    }
  }
  await pg.waitForTimeout(1500);

  const 점검 = await f.evaluate(() => {
    const t = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
    return { 샵: (t.match(/^##/gm) || []).length, 별표: (t.match(/\*\*/g) || []).length, 길이: t.length };
  });
  console.log(`  다시 쓴 뒤 — ## ${점검.샵}개 · ** ${점검.별표}개 · ${점검.길이}자`);
  if (점검.샵 || 점검.별표 || 점검.길이 < 500) {
    await pg.screenshot({ path: '/tmp/naver-fix.png' });
    throw new Error('본문이 깨끗하지 않습니다 — 발행하지 않고 멈춥니다. 화면: /tmp/naver-fix.png');
  }

  const clickArea2 = async (area, timeout = 20000) => {
    const b = f.locator(`button[data-click-area="${area}"]`).first();
    await b.waitFor({ state: 'visible', timeout });
    await b.click({ timeout: 8000 });
  };
  await clickArea2('tpb.publish');
  await pg.waitForTimeout(1500);
  try { await clickArea2('tpb*i.publish', 20000); }
  catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
  await pg.waitForTimeout(6000);
  const 주소 = pg.url();
  if (/PostWriteForm|postwrite/i.test(주소)) {
    await pg.screenshot({ path: '/tmp/naver-fix.png' });
    throw new Error('발행 확인이 안 됩니다. 화면: /tmp/naver-fix.png');
  }
  console.log('  ✓ 본문을 다시 써서 발행했습니다 →', 주소);
  await ctx.close().catch(() => {});
  process.exit(0);
}

// 바꿀 문단을 찾는다
const 자리 = await f.evaluate((찾기) => {
  const ps = [...document.querySelectorAll('.se-text-paragraph')];
  const i = ps.findIndex((p) => (p.innerText || '').includes(찾기));
  if (i < 0) return null;
  const r = ps[i].getBoundingClientRect();
  return { 번호: i, 글: (ps[i].innerText || '').trim().slice(0, 120), 전체: ps.length,
           x: Math.round(r.x + Math.min(r.width / 2, 120)), y: Math.round(r.y + r.height / 2) };
}, 찾기);

if (!자리) {
  console.log(`  「${찾기}」가 든 문단을 못 찾았습니다. 글이 안 열렸거나 이미 고쳐졌습니다.`);
  await pg.screenshot({ path: '/tmp/naver-fix.png' });
  console.log('  화면: /tmp/naver-fix.png');
  await ctx.close().catch(() => {});
  process.exit(1);
}
console.log(`  문단 ${자리.번호 + 1}/${자리.전체} 에서 찾았습니다:`);
console.log(`    ${자리.글}`);

if (보기만 || !바꾸기) {
  console.log('\n  보기만 했습니다. 바꾸려면 --바꾸기 "새 문단" 을 주세요.');
  await ctx.close().catch(() => {});
  process.exit(0);
}

// 세 번 클릭 = 문단 전체 선택 → 다시 친다
await pg.mouse.click(자리.x, 자리.y, { clickCount: 3 });
await pg.waitForTimeout(600);
const 새문단 = 바꾸기.split('|');
for (const [i, 줄] of 새문단.entries()) {
  if (i > 0) await pg.keyboard.press('Enter');
  await pg.keyboard.type(줄, { delay: 8 });
}
await pg.waitForTimeout(1500);

// 제대로 들어갔는지 눈으로 확인하고 나서 발행한다
const 확인 = await f.evaluate((찾기) => {
  const t = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
  return { 남았나: t.includes(찾기), 길이: t.length };
}, 찾기);
console.log(`  바꾼 뒤 — 「${찾기}」 남음: ${확인.남았나} · 본문 ${확인.길이}자`);
if (확인.남았나) {
  await pg.screenshot({ path: '/tmp/naver-fix.png' });
  throw new Error('옛 글자가 그대로입니다 — 발행하지 않고 멈춥니다. 화면: /tmp/naver-fix.png');
}

// 발행 (2단계)
const clickArea = async (area, timeout = 20000) => {
  const b = f.locator(`button[data-click-area="${area}"]`).first();
  await b.waitFor({ state: 'visible', timeout });
  await b.click({ timeout: 8000 });
};
await clickArea('tpb.publish');
await pg.waitForTimeout(1500);
try { await clickArea('tpb*i.publish', 20000); }
catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
await pg.waitForTimeout(6000);

const url = pg.url();
if (/PostWriteForm|postwrite/i.test(url)) {
  await pg.screenshot({ path: '/tmp/naver-fix.png' });
  throw new Error('발행 확인이 안 됩니다. 화면: /tmp/naver-fix.png');
}
console.log('  ✓ 고쳐 발행했습니다 →', url);
await ctx.close().catch(() => {});
