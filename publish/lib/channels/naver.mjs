// 네이버 블로그 — 공개된 글쓰기 API 가 없다.
// 그래서 사람이 하는 일을 그대로 대신한다: 브라우저로 글쓰기 창을 열고, 쓰고, 발행을 누른다.
//
// 로그인은 publish/.browser 프로필이 평소 크롬처럼 들고 있는다(우리가 쿠키를 읽지 않는다).
// 처음 한 번만:  node publish/naver-open.mjs  → 평소처럼 로그인
//
// 주의: 네이버 화면이 바뀌면 버튼 위치가 달라질 수 있다. 그럴 땐 NAVER_HEADLESS=0 으로
//      브라우저를 눈으로 보면서 돌리면 어디서 막혔는지 바로 보인다.
import { env, missing } from '../env.mjs';
import { openBrowser } from '../../naver-open.mjs';

const T = (s) => new RegExp(s);

export default {
  key: 'naver',
  name: '네이버 블로그',
  caps: { text: true, image: true, video: false, link: true, maxText: 0, maxMedia: 20 },
  needs: ['NAVER_BLOG_ID'],
  note: '공개 API 가 없어 브라우저로 대신 씁니다. 처음 한 번 node publish/naver-open.mjs 로 로그인하세요.',
  free: true,
  browser: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], link, dry, title, category, serial, draft = false, blocks = null }) {
    const e = env();
    const blogId = e.NAVER_BLOG_ID;
    // 사진은 클립보드로 붙인다. 그런데 헤드리스 브라우저는 OS 클립보드를 못 읽는다.
    //   headless=true  → 붙은 이미지 0개
    //   headless=false → 붙은 이미지 1개   (2026-10-22 실측)
    // 그래서 사진이 있는 글은 보이는 창으로 띄운다. .env 의 NAVER_HEADLESS=0 이 그 설정이다.
    const headless = e.NAVER_HEADLESS !== '0';
    const subject = (title || text.split('\n').find((l) => l.trim()) || '오늘의 기록').slice(0, 100);
    if (dry) return { dry: true, would: `“${subject}” 글쓰기 + 사진 ${media.length}장 → ${draft ? '임시저장' : '발행'}` };

    const ctx = await openBrowser({ headless });
    try {
      const pg = ctx.pages()[0] || (await ctx.newPage());
      await pg.goto(`https://blog.naver.com/${blogId}/postwrite`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await pg.waitForTimeout(2500);

      if (/nid\.naver\.com/.test(pg.url())) {
        throw new Error('로그인이 풀렸어요. `node publish/naver-open.mjs` 로 한 번 로그인해 주세요.');
      }

      // 에디터는 iframe 안에 있다
      const f = pg.frames().find((fr) => /PostWriteForm|postwrite/i.test(fr.url())) || pg.mainFrame();

      // 고정 대기(2.5초)로는 에디터가 아직 안 그려진 때가 있었다. 요소가 생길 때까지 기다린다.
      // 이게 없으면 팝업 처리도 제목 클릭도 빈 화면에 대고 하게 된다. (2026-10-20 실측)
      await f.locator('.se-section-documentTitle').first()
             .waitFor({ state: 'attached', timeout: 30000 })
             .catch(() => { throw new Error('에디터가 뜨지 않았습니다. 로그인이 풀렸는지 확인해 주세요.'); });
      await pg.waitForTimeout(1200);

      // "작성 중인 글이 있습니다" 안내 — 떠도 안 떠도 지나가야 한다.
      // 예전엔 즉시 isVisible() 로 봤는데, 팝업은 로드 몇 초 뒤에 뜬다.
      // 그래서 못 보고 지나간 뒤 제목 클릭이 팝업 딤에 막혀 20초 타임아웃이 났다. (2026-10-20 실측)
      // 이어쓰기(확인)를 누르면 직전 글에 덧붙으므로 반드시 「취소」다.
      const dismissPopup = async (ms = 12000) => {
        // 팝업은 페이지 로드 몇 초 뒤에 뜬다. 「아직 안 떴다」와 「안 뜬다」는 다르므로
        // 창 전체를 끝까지 지켜본다. 예전엔 딤이 아직 없으면 바로 빠져나가서
        // 정작 뒤늦게 뜬 팝업이 사진 버튼을 막았다. (2026-10-20 실측)
        const until = Date.now() + ms;
        while (Date.now() < until) {
          const cancel = f.locator('.se-popup-button-cancel').first();
          if (await cancel.isVisible({ timeout: 400 }).catch(() => false)) {
            await cancel.click({ force: true }).catch(() => {});
            await pg.waitForTimeout(700);
            return true;
          }
          // 「작성 중인 글이 있습니다」 팝업은 .se-popup 밖에 뜰 수도 있다.
          // 반드시 「취소」를 누른다 — 「확인」을 누르면 실패한 시도가 남긴
          // 조각 글을 이어받아 엉뚱한 내용이 올라간다. (2026-10-22 실측)
          for (const label of ['취소', '새로 작성']) {
            for (const scope of ['.se-popup ', '']) {
              const b = f.locator(`${scope}button:has-text("${label}")`).first();
              if (await b.isVisible({ timeout: 250 }).catch(() => false)) {
                await b.click({ force: true }).catch(() => {});
                await pg.waitForTimeout(700);
                return true;
              }
            }
          }
          // 프레임 밖(페이지 본문)에 뜬 경우도 본다
          const outer = pg.locator('button:has-text("취소")').first();
          if (await outer.isVisible({ timeout: 250 }).catch(() => false)) {
            await outer.click({ force: true }).catch(() => {});
            await pg.waitForTimeout(700);
            return true;
          }
          await pg.waitForTimeout(400);
        }
        return false;
      };
      await dismissPopup();

      // 제목 — 클릭 직전에 딤이 남아 있으면 한 번 더 걷어 낸다
      if (await f.locator('.se-popup-dim').first().isVisible({ timeout: 800 }).catch(() => false)) await dismissPopup(4000);

      // 에디터는 글자(<p>)를 컨테이너가 덮고 있어 평범한 click 이 가로막힐 때가 있다.
      // (2026-10-20 실측: `.se-container intercepts pointer events` 로 20초 타임아웃)
      // 그래서 여러 방법을 차례로 시도한다. 하나라도 커서가 들어가면 된다.
      const focusInto = async (sels) => {
        for (const sel of sels) {
          const el = f.locator(sel).first();
          if (!(await el.count().catch(() => 0))) continue;
          // 순서가 중요하다. force 는 가려진 것을 무시하고 좌표를 눌러서,
          // 위에 겹친 툴바(취소선 등)를 대신 눌러 버린다. 그래서 맨 뒤로 둔다. (2026-10-20 실측)
          for (const how of ['normal', 'js', 'force']) {
            try {
              if (how === 'js') await el.evaluate((n) => { n.focus?.(); n.click?.(); });
              else await el.click({ timeout: 4000, force: how === 'force' });
              await pg.waitForTimeout(400);
              return true;
            } catch { /* 다음 방법 */ }
          }
        }
        return false;
      };

      // 토글 서식(굵게·기울임·밑줄·취소선)이 켜진 채면 본문 전체가 그 서식으로 들어간다.
      // 켜져 있으면 한 번 눌러 끈다.
      const clearFormats = async () => {
        for (const kind of ['bold', 'italic', 'underline', 'strikethrough']) {
          const b = f.locator(`button.se-${kind}-toolbar-button`).first();
          if (!(await b.count().catch(() => 0))) continue;
          const on = await b.evaluate((e) =>
            /\b(se-is-on|is-on|active|selected|on)\b/.test(e.className) || e.getAttribute('aria-pressed') === 'true'
          ).catch(() => false);
          if (on) { await b.click({ timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(200); }
        }
      };

      const titled = await focusInto([
        '.se-section-documentTitle .se-text-paragraph',
        '.se-documentTitle .se-text-paragraph',
        '.se-section-documentTitle',
        '.se-placeholder',
      ]);
      if (!titled) throw new Error('제목 칸에 커서를 넣지 못했습니다. NAVER_HEADLESS=0 으로 보면서 돌려 보세요.');
      await pg.keyboard.type(subject, { delay: 12 });

      // 본문
      const bodied = await focusInto([
        '.se-component.se-text .se-text-paragraph:nth-of-type(1)',
        '.se-section-text .se-text-paragraph',
        '.se-main-container .se-text-paragraph',
        '[contenteditable="true"]',
      ]);
      if (!bodied) throw new Error('본문 칸에 커서를 넣지 못했습니다.');
      await clearFormats();
      // 오른쪽 「도움말」 패널이 사진 버튼 클릭을 가로챈다. 한 번 닫아 둔다.
      // (2026-10-22 실측: se-help-title 이 pointer events 를 먹고 있었다)
      // 팝업을 닫아도 딤(se-popup-dim)이 남아 버튼을 덮는 경우가 있다.
      // 버튼 좌표가 0,0 으로 읽히고 elementFromPoint 가 딤을 돌려준다. (2026-10-22 실측)
      const clearDim = async () => {
        for (let i = 0; i < 6; i++) {
          const 남음 = await f.evaluate(() => {
            const dims = [...document.querySelectorAll('.se-popup-dim, [class*="popup-dim"]')]
              .filter(d => d.offsetParent !== null || getComputedStyle(d).display !== 'none');
            if (!dims.length) return 0;
            // 아직 팝업이 살아 있으면 취소를 한 번 더
            const cancel = document.querySelector('.se-popup-button-cancel')
              || [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim() === '취소');
            if (cancel) { cancel.click(); return dims.length; }
            dims.forEach(d => { d.style.display = 'none'; });   // 끝내 안 걷히면 치운다
            return 0;
          }).catch(() => 0);
          if (!남음) return true;
          await pg.waitForTimeout(900);
        }
        return false;
      };

      const closeHelp = async () => {
        await f.evaluate(() => {
          const h = document.querySelector('.se-help-title, [class*="se-help"]');
          if (!h) return;
          const panel = h.closest('[class*="container"]') || h.parentElement;
          const x = panel?.querySelector('button[class*="close"], .se-help-close, button');
          if (x) x.click();
          else if (panel) panel.style.display = 'none';   // 닫기 버튼이 없으면 치운다
        }).catch(() => {});
        await pg.keyboard.press('Escape').catch(() => {});
        await pg.waitForTimeout(800);
      };
      await clearDim();
      await closeHelp();

      const addPhoto = async (filePath) => {
        // 자리표를 쓰지 않는다. 글자를 넣었다 지우면 백스페이스가 덜 먹어
        // 「IM잦은…」처럼 찌꺼기가 남는다. (2026-10-22 실측)
        //
        // 대신 본문 블록을 순서대로 쓰다가 그림 차례가 오면 그 자리에서 바로 붙인다.
        // 커서는 이미 그 자리에 있으므로 자리표가 필요 없다.
        const { execFileSync } = await import('node:child_process');
        execFileSync('osascript', ['-e',
          `set the clipboard to (read (POSIX file "${filePath.replace(/"/g, '\\"')}") as «class PNGf»)`]);

        const box = f.locator('.se-main-container [contenteditable="true"], [contenteditable="true"]').last();
        await box.click({ timeout: 15000 }).catch(() => {});
        await pg.keyboard.press('End').catch(() => {});
        await pg.keyboard.press('Meta+v');
        await pg.waitForTimeout(7000);          // 업로드될 때까지

        // 사진 뒤에 커서를 두어 다음 글이 캡션으로 안 들어가게
        await box.click().catch(() => {});
        await pg.keyboard.press('End').catch(() => {});
        await pg.keyboard.press('Enter').catch(() => {});
      };

      if (blocks && blocks.length) {
        // 글 순서 그대로 — 글자는 치고, 이미지는 그 자리에서 올린다.
        // 예전에는 본문을 다 친 뒤 사진을 전부 뒤에 붙여서 위치가 어긋났다.
        // 블록 사이에 빈 줄을 하나 둔다. 안 그러면 소제목이 앞 문단에 붙어 보인다.
        // (2026-10-22 실측: 「정리」가 링크 바로 밑에 붙었다)
        for (const [i, b] of blocks.entries()) {
          if (b.type === 'image') { await addPhoto(b.path); continue; }
          if (i > 0 && blocks[i - 1].type === 'text') {
            await pg.keyboard.press('Enter');          // 앞 글 블록과 한 줄 띄운다
          }
          for (const line of String(b.text || '').split('\n')) {
            await pg.keyboard.type(line, { delay: 6 });
            await pg.keyboard.press('Enter');
          }
        }
        if (link) { await pg.keyboard.type(`\n원문 → ${link}`, { delay: 6 }); }
      } else {
        const body = text + (link ? `\n\n원문 → ${link}` : '');
        for (const line of body.split('\n')) {
          await pg.keyboard.type(line, { delay: 6 });
          await pg.keyboard.press('Enter');
        }
        for (const m of media.filter((x) => x.kind === 'image')) await addPhoto(m.path);
      }

      // 임시저장 — 발행 레이어를 열지 않고 「저장」만 누른다.
      // 왜 분리했나: 발행은 되돌리기 어렵다. 글을 넣어 두고 사람이 눈으로 본 뒤 발행하려면
      // 저장 단계에서 멈출 수 있어야 한다. 카테고리·태그는 발행 레이어에 있으므로 여기서는 건너뛴다.
      if (draft) {
        // 「저장」 버튼만 정확히 고른다. has-text 는 「임시저장」·「저장 글」도 잡고,
        // .first() 가 엉뚱한 걸 눌러 발행까지 가는 사고가 났다. (2026-10-22 실측)
        // 글자가 정확히 「저장」 또는 「저장 3」 인 것만 누른다.
        const 눌림 = await f.evaluate(() => {
          const b = [...document.querySelectorAll('button')]
            .find((e) => /^저장(\s*\d+)?$/.test((e.innerText || '').trim()));
          if (!b) return false;
          b.click();
          return true;
        });
        if (!눌림) throw new Error('저장 버튼을 못 찾았습니다 — 발행하지 않고 멈춥니다');
        await pg.waitForTimeout(3000);

        // 발행 레이어가 열렸으면 사고다. 바로 닫는다.
        const 발행창 = await f.evaluate(() =>
          /발행 설정|공개 설정|카테고리/.test(document.body.innerText || '')).catch(() => false);
        if (발행창) {
          await pg.keyboard.press('Escape').catch(() => {});
          throw new Error('발행 레이어가 열렸습니다 — 저장만 하려다 발행으로 갈 뻔해 멈췄습니다');
        }
        await pg.waitForTimeout(3000);
        // 저장 개수 뱃지가 올라가면 저장된 것. 못 읽어도 실패로 보지 않는다.
        let count = '';
        try {
          count = (await f.locator('.text__tWz5F, button:has-text("저장") + span').first().innerText({ timeout: 3000 })).trim();
        } catch { /* 뱃지를 못 읽는 건 저장 실패가 아니다 */ }
        return { draft: `https://blog.naver.com/${blogId}/postwrite`, saved: true, count };
      }

      // 발행 — 오른쪽 위 버튼 → 설정 레이어의 확인 버튼
      // 네이버 UI 변경(2026-10-23): has-text("발행") 가 숨은 '예약(reserve/schedule)' 버튼도
      // 잡아 .first() 가 안 보이는 버튼을 눌러 멈췄다. 보이는 '발행'만, 예약 버튼은 제외한다.
      const clickPublish = async (timeout = 20000) => {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
          const cands = f.locator('button:has-text("발행")');
          const n = await cands.count().catch(() => 0);
          for (let i = 0; i < n; i++) {
            const b = cands.nth(i);
            const meta = ((await b.getAttribute('class').catch(() => '')) || '') + ' ' +
                         ((await b.getAttribute('data-click-area').catch(() => '')) || '');
            if (/reserve|schedule/i.test(meta)) continue;          // 예약 버튼 제외
            if (!(await b.isVisible().catch(() => false))) continue; // 보이는 것만
            if (!(await b.isEnabled().catch(() => false))) continue;
            await b.click({ timeout: 5000 });
            return true;
          }
          await pg.waitForTimeout(400);
        }
        throw new Error('보이는 발행 버튼을 못 찾았습니다(네이버 UI 변경 가능)');
      };
      await clickPublish(20000);
      await pg.waitForTimeout(1500);

      // 설정 레이어에서 카테고리를 고른다 (자동 분류가 정해 준 값)
      if (category) {
        try {
          const opener = f.locator('button:has-text("카테고리"), .selectbox_button__jb1Dt').first();
          if (await opener.isVisible().catch(() => false)) { await opener.click(); await pg.waitForTimeout(500); }
          const want = category.replace(/\s+/g, '');
          const item = f.locator('label, li, button, span').filter({ hasText: category.split(' ').pop() }).first();
          if (await item.isVisible().catch(() => false)) { await item.click(); await pg.waitForTimeout(400); }
          else console.warn('  카테고리를 못 찾아 기본값으로 둡니다: ' + want);
        } catch { /* 카테고리 선택 실패해도 발행은 계속한다 */ }
      }

      // 일련번호를 태그로 남긴다 — 제목은 건드리지 않는다
      if (serial) {
        try {
          const tag = f.locator('input[placeholder*="태그"], #tag-input').first();
          if (await tag.isVisible().catch(() => false)) {
            await tag.click(); await pg.keyboard.type(serial, { delay: 10 }); await pg.keyboard.press('Enter');
            await pg.waitForTimeout(300);
          }
        } catch { /* 태그 실패는 무시 */ }
      }

      // [디버그] 발행 레이어 상태 캡처 — 정확한 버튼 구조 파악용
      if (process.env.NAVER_DEBUG) {
        try {
          await pg.screenshot({ path: '/tmp/naver-publish-layer.png', fullPage: false });
          const btns = await f.evaluate(() => [...document.querySelectorAll('button')]
            .filter(b => /발행|확인|예약/.test(b.innerText || ''))
            .map(b => ({ t: (b.innerText||'').trim().slice(0,12), c: b.className, a: b.getAttribute('data-click-area'),
                         vis: !!(b.offsetParent) })));
          console.log('[디버그] 발행/확인 버튼들:', JSON.stringify(btns, null, 2));
        } catch (e) { console.log('[디버그] 캡처 실패:', e.message); }
      }

      // 설정 레이어의 '확인(발행)' 버튼 — 같은 규칙(예약 제외·보이는 것만)으로 누른다
      await pg.waitForTimeout(600);
      await clickPublish(20000);
      await pg.waitForTimeout(5000);

      const url = pg.url();
      if (/postwrite/i.test(url)) throw new Error('발행 버튼까지 갔지만 확인이 안 됩니다. NAVER_HEADLESS=0 으로 한 번 보면서 돌려 보세요.');
      return { url, id: url.split('/').pop() };
    } finally {
      await ctx.close().catch(() => {});
    }
  },
};
