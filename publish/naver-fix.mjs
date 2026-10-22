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
const 청소 = args.includes('--청소');
const 글자바꾸기 = 옵션('--글자바꾸기', '');   // "틀린것=>맞는것" — 문단 안의 글자만 고친다
const 이어붙이기 = 옵션('--이어붙이기', '');   // 글폴더 — 원고에 있는데 글에 없는 뒷부분을 끝에 붙인다        // 마크다운 찌꺼기(## · ** · [x](y))만 문단째 고쳐 쓴다
const 바꾸기 = 옵션('--바꾸기', '');
const 보기만 = args.includes('--보기만');
const blogId = 옵션('--blog', 'ianlove80');
if (!id || (!찾기 && !다시쓰기 && !청소 && !글자바꾸기 && !이어붙이기)) {
  console.log('쓰는 법: node publish/naver-fix.mjs <글ID> --찾기 "글자" [--바꾸기 "새 문단|둘째 문단"] [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --다시쓰기 naver-blog/posts/<글폴더> [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --청소 [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --글자바꾸기 "확인합니니다=>확인합니다" [--보기만]');
  console.log('         node publish/naver-fix.mjs <글ID> --이어붙이기 naver-blog/posts/<글폴더> [--보기만]');
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

// ── 원고에 있는데 글에 없는 뒷부분을 이어 붙이기 ──────────────
// 왜 — 「간호사 핸드크림」 글은 「정리」와 공식몰 주소가 통째로 빠진 채 발행됐다.
// 편집 중이던 미완성본이 그대로 올라간 것이다. 글을 지우고 다시 쓰면 주소와
// 조회가 날아가므로, **빠진 뒤쪽만 이어 붙인다**. (2026-10-23)
if (이어붙이기) {
  const fs2 = await import('node:fs');
  const path2 = await import('node:path');
  const { toNaver } = await import('../naver-blog/lib/tonaver.mjs');
  const 원고길 = path2.resolve(이어붙이기, 'post.md');
  if (!fs2.existsSync(원고길)) throw new Error('원고가 없습니다: ' + 원고길);
  const { blocks } = toNaver(fs2.readFileSync(원고길, 'utf8'));
  const 원고줄 = blocks.filter((b) => b.type === 'text')
    .flatMap((b) => String(b.text).split('\n')).map((x) => x.trim()).filter(Boolean);

  const 납작2 = (x) => x.replace(/https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'*+;=%-]+/g, ' ')
    .replace(/\(\s*\)/g, ' ').replace(/\s+/g, '').replace(/[·•]/g, '');
  const 문단들 = async () => f.evaluate(() => [...document.querySelectorAll('.se-text-paragraph')]
    .map((p) => (p.innerText || '').trim()));
  const 지금문단 = await 문단들();
  const 지금본문 = 지금문단.join('\n');
  const 지금납작 = 납작2(지금본문);

  // 원고 줄을 앞에서부터 보며 **처음으로 없는 줄**을 찾는다. 거기부터가 빠진 뒤쪽이다.
  // 주소만 있는 줄은 납작2 가 비워 버린다. 그런 줄은 **주소 글자 그대로** 있나로 본다.
  const 이미있나 = (줄, 문단, 본문, 납작본문) => {
    const 주소 = 줄.trim().match(/^https?:\/\/\S+$/);
    if (주소) return 본문.includes(주소[0]);
    const n = 납작2(줄);
    if (!n) return true;
    // 「정리」처럼 짧은 소제목은 부분일치로 보면 안 된다.
    // 「정리하면 이렇습니다」에 걸려 「있다」고 나온다. 문단과 **통째로 같은지**로 본다.
    if (n.length <= 6) return 문단.some((p) => 납작2(p) === n);
    return 납작본문.includes(n);
  };
  const 첫빠짐 = 원고줄.findIndex((줄) => !이미있나(줄, 지금문단, 지금본문, 지금납작));
  if (첫빠짐 < 0) {
    console.log('  원고에 있는 줄이 전부 글에 있습니다 — 붙일 것이 없습니다.');
    await ctx.close().catch(() => {});
    process.exit(0);
  }
  const 붙일것 = 원고줄.slice(첫빠짐).filter((줄) => !이미있나(줄, 지금문단, 지금본문, 지금납작));
  console.log(`  원고 ${원고줄.length}줄 중 ${첫빠짐}번째부터 빠졌습니다. 붙일 줄 ${붙일것.length}개:`);
  붙일것.forEach((x) => console.log(`    + ${x.slice(0, 100)}`));
  if (보기만) { await ctx.close().catch(() => {}); process.exit(0); }

  // 본문 맨 끝으로 간다
  const 끝자리 = await f.evaluate(() => {
    const ps = [...document.querySelectorAll('.se-text-paragraph')];
    const 마지막 = ps[ps.length - 1];
    마지막.scrollIntoView({ block: 'center' });
    const r = 마지막.getBoundingClientRect();
    return { x: Math.round(r.x + Math.min(r.width - 6, 300)), y: Math.round(r.y + r.height / 2),
             글: (마지막.innerText || '').trim().slice(0, 50), 수: ps.length };
  });
  await pg.waitForTimeout(800);
  console.log(`  마지막 문단(${끝자리.수}번째): ${끝자리.글}`);
  await pg.mouse.click(끝자리.x, 끝자리.y);
  await pg.waitForTimeout(400);
  await pg.keyboard.press('End');
  await pg.waitForTimeout(200);

  for (const 줄 of 붙일것) {
    await pg.keyboard.press('Enter');
    await pg.keyboard.type(줄, { delay: 12 });
    await pg.waitForTimeout(250);
  }
  await pg.waitForTimeout(1500);

  // 붙인 것이 글자 그대로 들어갔는지 되읽는다
  const 뒤문단 = await 문단들();
  const 뒤본문 = 뒤문단.join('\n');
  const 뒤납작 = 납작2(뒤본문);
  const 아직없음 = 붙일것.filter((줄) => !이미있나(줄, 뒤문단, 뒤본문, 뒤납작));
  if (아직없음.length) {
    아직없음.forEach((x) => console.log(`    ✗ 안 들어감: ${x.slice(0, 80)}`));
    throw new Error('붙인 글자가 그대로 안 들어갔습니다 — 발행하지 않고 멈춥니다');
  }
  console.log(`  ✓ ${붙일것.length}줄 모두 글자 그대로 들어갔습니다`);

  const 누르기3 = async (area, timeout = 20000) => {
    const b = f.locator(`button[data-click-area="${area}"]`).first();
    await b.waitFor({ state: 'visible', timeout });
    await b.click({ timeout: 8000 });
  };
  await 누르기3('tpb.publish');
  await pg.waitForTimeout(1500);
  try { await 누르기3('tpb*i.publish', 20000); }
  catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
  await pg.waitForTimeout(6000);
  if (/PostWriteForm|postwrite/i.test(pg.url())) throw new Error('발행 확인이 안 됩니다');
  console.log('  ✓ 이어 붙여 발행했습니다 →', pg.url());
  await ctx.close().catch(() => {});
  process.exit(0);
}

// ── 글자 하나만 고치기 ────────────────────────────────────
// 왜 — 내 타이핑이 「확인합니다」를 「확인합니니다」로, 「큰 틀은」을 「큰 틀은은」으로
// 만들었다. 마크다운 찌꺼기가 아니라서 청소기엔 안 걸린다. (2026-10-23)
if (글자바꾸기) {
  const [틀린것, 맞는것] = 글자바꾸기.split('=>');
  if (!틀린것 || 맞는것 === undefined) throw new Error('--글자바꾸기 "틀린것=>맞는것" 꼴로 주세요');

  const 대상 = await f.evaluate((틀린것) => {
    const ps = [...document.querySelectorAll('.se-text-paragraph')];
    const i = ps.findIndex((p) => (p.innerText || '').includes(틀린것));
    if (i < 0) return null;
    const r = ps[i].getBoundingClientRect();
    return { 번호: i, 글: (ps[i].innerText || '').trim(),
             x: Math.round(r.x + Math.min(r.width / 2, 100)), y: Math.round(r.y + r.height / 2) };
  }, 틀린것);
  if (!대상) {
    console.log(`  「${틀린것}」가 든 문단이 없습니다 — 이미 고쳐졌거나 글자가 다릅니다.`);
    await ctx.close().catch(() => {});
    process.exit(1);
  }
  const 새글 = 대상.글.split(틀린것).join(맞는것);
  console.log(`  문단 ${대상.번호}`);
  console.log(`    전: ${대상.글.slice(0, 100)}`);
  console.log(`    후: ${새글.slice(0, 100)}`);
  if (보기만) { await ctx.close().catch(() => {}); process.exit(0); }

  await f.evaluate((i) => document.querySelectorAll('.se-text-paragraph')[i]
    ?.scrollIntoView({ block: 'center' }), 대상.번호);
  await pg.waitForTimeout(800);
  const 자리 = await f.evaluate((i) => {
    const r = document.querySelectorAll('.se-text-paragraph')[i].getBoundingClientRect();
    return { x: Math.round(r.x + Math.min(r.width / 2, 100)), y: Math.round(r.y + r.height / 2) };
  }, 대상.번호);

  const 같나 = (a, b) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();
  let 들어갔나 = false;
  for (let 시도 = 0; 시도 < 3 && !들어갔나; 시도 += 1) {
    await pg.mouse.click(자리.x, 자리.y, { clickCount: 3 });
    await pg.waitForTimeout(500);
    await pg.keyboard.type(새글, { delay: 14 });
    await pg.waitForTimeout(1000);
    const 지금 = await f.evaluate((i) =>
      (document.querySelectorAll('.se-text-paragraph')[i]?.innerText || '').trim(), 대상.번호);
    들어갔나 = 같나(지금, 새글);
    if (!들어갔나) console.log(`    어긋남(시도 ${시도 + 1}): ${지금.slice(0, 100)}`);
  }
  if (!들어갔나) throw new Error('글자가 그대로 안 들어갑니다 — 발행하지 않고 멈춥니다');

  const 누르기2 = async (area, timeout = 20000) => {
    const b = f.locator(`button[data-click-area="${area}"]`).first();
    await b.waitFor({ state: 'visible', timeout });
    await b.click({ timeout: 8000 });
  };
  await 누르기2('tpb.publish');
  await pg.waitForTimeout(1500);
  try { await 누르기2('tpb*i.publish', 20000); }
  catch { await f.locator('button:has-text("발행")').last().click({ timeout: 8000 }); }
  await pg.waitForTimeout(6000);
  if (/PostWriteForm|postwrite/i.test(pg.url())) throw new Error('발행 확인이 안 됩니다');
  console.log('  ✓ 고쳐 발행했습니다 →', pg.url());
  await ctx.close().catch(() => {});
  process.exit(0);
}

// ── 마크다운 찌꺼기만 문단째 고쳐 쓰기 ────────────────────────
// 왜 이렇게 하나: 수정 화면에서는 스마트에디터가 선택을 숨은 입력 버퍼로 가져가서
// window.getSelection() 이 늘 비어 있다. Cmd+A 로 본문만 골랐는지 확인할 방법이 없어
// 「전체 지우고 다시 쓰기」는 제목까지 날릴 위험이 있다.
// 그래서 **찌꺼기가 든 문단만** 세 번 클릭으로 골라 다시 친다. (2026-10-23)
if (청소) {
  // 발행된 글 목록을 받아 둔다 — 내부 링크를 「글 주소」로 되돌리는 데 쓴다.
  // 지금까지 내부 링크가 전부 blog.naver.com/<아이디> (블로그 홈)만 가리켰다.
  // 홈으로 보내면 독자는 그 글을 못 찾는다. (2026-10-23)
  const 목록 = new Map();
  for (let p = 1; p <= 4; p += 1) {
    const t = await fetch(`https://blog.naver.com/PostTitleListAsync.naver?blogId=${blogId}&viewdate=&currentPage=${p}&categoryNo=0&parentCategoryNo=&countPerPage=30`,
      { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => r.text()).catch(() => '');
    const 전 = 목록.size;
    for (const m of t.matchAll(/"logNo":"(\d+)","title":"([^"]*)"/g)) {
      목록.set(decodeURIComponent(m[2].replace(/\+/g, ' ')), m[1]);
    }
    if (목록.size === 전) break;
  }
  const 납작 = (x) => x.replace(/[\s,·—–\-'"?!()]/g, '');
  // 제목이 링크 글자와 똑같이 생기지 않는다.
  //   링크 「맞춤 화장품 고르는 순서」 ↔ 제목 「맞춤형 화장품, 내 피부에 맞는 걸 고르는 순서」
  // 그래서 통째로 비교하지 않고 **두 글자 조각이 얼마나 겹치나**로 고른다. (2026-10-23)
  const 조각 = (x) => { const n = 납작(x); const s = new Set();
    for (let i = 0; i + 2 <= n.length; i += 1) s.add(n.slice(i, i + 2)); return s; };
  const 찾아주소 = (이름) => {
    const n = 납작(이름);
    if (n.length < 4 || n.length > 40) return null;
    const a = 조각(이름);
    let best = null; let 점수 = 0;
    for (const [제목, 번호] of 목록) {
      const b = 조각(제목);
      let 겹침 = 0;
      a.forEach((x) => { if (b.has(x)) 겹침 += 1; });
      const 비율 = 겹침 / a.size;                  // 링크 글자가 제목에 얼마나 들어 있나
      if (비율 > 점수) { 점수 = 비율; best = 번호; }
    }
    return 점수 >= 0.7 ? `https://blog.naver.com/${blogId}/${best}` : null;
  };
  const 못찾은링크 = new Set();

  const 씻기 = (t) => {
    let x = t.trim();
    // 구분선은 문단째 지운다
    if (/^(-{3,}|={3,}|\*{3,})$/.test(x)) return '';
    // 표 한 줄 → 줄글. 머리글 구분선(|---|---|)은 버린다
    if (/^\s*\|.*\|\s*$/.test(x)) {
      const 칸 = x.split('|').slice(1, -1).map((c) => c.trim());
      if (칸.every((c) => /^:?-{2,}:?$/.test(c))) return '';
      x = '· ' + 칸.filter(Boolean).join(' — ');
    }
    x = x
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, 이름, 주소) => {
        // 블로그 홈만 가리키는 내부 링크는 진짜 글 주소로 바꾼다
        const 홈만 = new RegExp(`^https?://(m\\.)?blog\\.naver\\.com/${blogId}/?$`).test(주소);
        const 고친 = 홈만 ? 찾아주소(이름) : null;
        if (홈만 && !고친) 못찾은링크.add(이름);
        return `${이름} ${고친 || 주소}`;
      })
      // 이미 [x](y) 가 풀린 뒤 남은 「이름 + 블로그 홈」 꼴도 고친다.
      // 어디서부터가 링크 이름인지 모르므로 **주소 바로 앞 글자를 길이별로 줄여 가며** 맞춰 본다.
      .replace(new RegExp(`([^\\n]{4,30})(https?://(?:m\\.)?blog\\.naver\\.com/${blogId})(?![/\\w])`, 'g'),
        (전부, 앞, 주소) => {
          const 토막 = 앞.replace(/[\s(]+$/, '');
          for (let n = Math.min(토막.length, 26); n >= 4; n -= 1) {
            const 이름 = 토막.slice(-n).replace(/^[^가-힣A-Za-z0-9]+/, '').trim();
            if (이름.length < 4) continue;
            const 고친 = 찾아주소(이름);
            if (고친) return 전부.slice(0, 앞.length - 이름.length) + `${이름} ${고친}`;
          }
          못찾은링크.add(토막.slice(-20).trim());
          return 전부;
        })
      .replace(/\*\*/g, '')
      .replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s).,]|$)/g, '$1$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^>\s*/, '')
      .replace(/^#{1,6}\s+/, '')     // 「## 제목」만. 「#태그」는 건드리지 않는다
      .replace(/^[-*]\s+/, '· ')
      .replace(/\s+/g, ' ')
      .trim();
    return x;
  };

  // 더러운 문단을 고르는 규칙을 따로 적지 않는다.
  // **씻기()가 바꿀 게 있으면 더러운 것**이다. 규칙을 두 군데 적어 두니
  // 한쪽만 고치고 「깨끗하다」고 말하는 일이 생겼다. (2026-10-23)
  const 더러운것 = async () => {
    const 글들 = await f.evaluate(() => [...document.querySelectorAll('.se-text-paragraph')]
      .map((p) => (p.innerText || '').trim()));
    return 글들.map((t, i) => [i, t, 씻기(t)]).filter(([, t, c]) => t && c !== t);
  };

  if (보기만) {
    const 목 = await 더러운것();
    목.forEach(([i, t, c]) => console.log(`   ${i}: ${t.slice(0, 80)}\n      → ${(c || '(문단 지움)').slice(0, 80)}`));
    console.log(`\n  고칠 문단 ${목.length}개.` + (못찾은링크.size
      ? ` 글 주소를 못 찾은 링크: ${[...못찾은링크].join(', ')}` : ''));
    console.log('  실제로 고치려면 --보기만 을 빼세요.');
    await ctx.close().catch(() => {});
    process.exit(0);
  }

  let 고친수 = 0;
  let 직전남은수 = Infinity;
  for (let 회 = 0; 회 < 80; 회 += 1) {
    const 목 = await 더러운것();
    if (!목.length) { console.log(`  더 고칠 문단 없음 — ${고친수}개 고쳤습니다`); break; }
    const [번호, 옛글, 새글] = 목[0];

    const 자리 = await f.evaluate((i) => {
      const p = document.querySelectorAll('.se-text-paragraph')[i];
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { x: Math.round(r.x + Math.min(r.width / 2, 100)), y: Math.round(r.y + r.height / 2),
               보이나: r.height > 0 && r.y > 60 && r.y < 760 };
    }, 번호);
    if (!자리) throw new Error(`문단 ${번호} 가 사라졌습니다`);
    if (!자리.보이나) {
      await f.evaluate((i) => document.querySelectorAll('.se-text-paragraph')[i]
        ?.scrollIntoView({ block: 'center' }), 번호);
      await pg.waitForTimeout(800);
      continue;
    }

    // 친 글자를 **되읽어 글자 그대로** 맞춰 본다.
    // 2026-10-23: 「확인합니다」가 「확인합니니다」로 들어갔다. 한 글자가 늘었는데
    // 「더러운 문단 수」만 보고 있어서 통과시켰다. 세는 것과 맞춰 보는 것은 다르다.
    const 같나 = (a, b) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();
    let 들어갔나 = false;
    for (let 시도 = 0; 시도 < 2 && !들어갔나; 시도 += 1) {
      await pg.mouse.click(자리.x, 자리.y, { clickCount: 3 });
      await pg.waitForTimeout(500);
      if (새글) {
        await pg.keyboard.type(새글, { delay: 12 });
      } else {
        await pg.keyboard.press('Backspace');     // 구분선·표 머리글은 문단째 지운다
        await pg.keyboard.press('Backspace');
        들어갔나 = true;
        break;
      }
      await pg.waitForTimeout(900);
      const 지금 = await f.evaluate((i) =>
        (document.querySelectorAll('.se-text-paragraph')[i]?.innerText || '').trim(), 번호);
      들어갔나 = 같나(지금, 새글);
      if (!들어갔나) {
        console.log(`   ${번호} 글자가 어긋났습니다(시도 ${시도 + 1})`);
        console.log(`      넣으려던 것: ${새글.slice(0, 90)}`);
        console.log(`      들어간 것  : ${지금.slice(0, 90)}`);
      }
    }
    if (!들어갔나) {
      throw new Error(`문단 ${번호} 에 글자가 그대로 안 들어갑니다 — 발행하지 않고 멈춥니다`);
    }
    await pg.waitForTimeout(400);

    // 문단을 지우면 번호가 밀린다. 그래서 「그 번호가 깨끗해졌나」로 보면 안 된다.
    // **남은 더러운 문단 수가 줄었나**로 본다. (2026-10-23 당함)
    const 남은수 = (await 더러운것()).length;
    console.log(`   ${번호} → ${(새글 || '(문단 지움)').slice(0, 58)}   남은 ${남은수}`);
    if (남은수 >= 직전남은수) {
      throw new Error(`문단 ${번호}「${옛글.slice(0, 40)}」를 고쳐도 안 줄었습니다(${직전남은수}→${남은수}) — 발행하지 않고 멈춥니다`);
    }
    직전남은수 = 남은수;
    고친수 += 1;
  }

  // 고친 게 없으면 발행하지 않는다 — 헛발행은 글 수정일만 바꾼다
  if (!고친수) {
    console.log('  바꾼 것이 없어 발행하지 않습니다.');
    if (못찾은링크.size) console.log(`  ⚠ 글 주소를 못 찾은 링크: ${[...못찾은링크].join(', ')}`);
    await ctx.close().catch(() => {});
    process.exit(0);
  }

  const 점검 = await f.evaluate(() => {
    const t = (document.querySelector('.se-content, .se-canvas, .se-main-container')?.innerText || '');
    return { 샵: (t.match(/^#{1,6}\s/gm) || []).length, 별표: (t.match(/\*\*/g) || []).length,
             표: (t.match(/^\s*\|.*\|\s*$/gm) || []).length,
             목록: (t.match(/^[-*]\s+\S/gm) || []).length,
             링크: (t.match(/\]\(http/g) || []).length,
             atolian: (t.match(/atolian/g) || []).length, 길이: t.length };
  });
  console.log(`  고친 뒤 — ## ${점검.샵} · ** ${점검.별표} · 표 ${점검.표} · 목록 ${점검.목록} · [](){${점검.링크}} · atolian ${점검.atolian} · ${점검.길이}자`);
  if (못찾은링크.size) console.log(`  ⚠ 글 주소를 못 찾은 링크: ${[...못찾은링크].join(', ')} (그 글이 아직 발행 안 됐을 수 있습니다)`);
  if (점검.샵 || 점검.별표 || 점검.표 || 점검.목록 || 점검.링크 || 점검.atolian) {
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
