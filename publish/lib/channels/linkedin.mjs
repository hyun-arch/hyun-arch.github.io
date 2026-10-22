// 링크드인 — 브라우저로 올린다. 앱 등록도 토큰도 필요 없다.
//
// 왜 API 를 안 쓰나 (2026-10-22):
//   API 로 올리려면 developer.linkedin.com 에서 앱을 만들고
//   회사 페이지를 연결하고 Products 를 붙여야 한다. 손이 너무 많이 간다.
//   그냥 로그인된 브라우저에서 사람처럼 올리면 된다.
//   (옛 API 판은 linkedin.api.mjs.bak 에 남겨 뒀다)
//
// 다만 링크드인은 자동 게시를 막는다 —
//   「We encountered a problem sharing your post」 (2026-10-20 실측)
//   본문이 길면 더 잘 막힌다. 1,353자는 거부, 753자는 통과했다.
//   그래서 본문을 채워 두고 마지막 Post 만 사람이 누르는 쪽으로 간다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.resolve(HERE, '../../.browser-sns');

export default {
  key: 'linkedin',
  name: '링크드인',
  caps: { text: true, image: true, video: false, link: true, maxText: 3000, maxMedia: 9 },
  needs: [],
  note: '브라우저로 올립니다. 로그인만 돼 있으면 됩니다 — 앱 등록 불필요.',
  free: true,
  manual: true,          // 마지막 Post 는 사람이 누른다

  ready() { return []; },   // 토큰이 필요 없다

  async post({ text, media = [], dry }) {
    if (dry) return { dry: true, would: `본문 ${text.length}자를 채워 두고 Post 는 사람이` };

    const { chromium } = await import('playwright');
    const ctx = await chromium.launchPersistentContext(PROFILE, {
      headless: false, viewport: null, locale: 'ko-KR',
    });
    const pg = ctx.pages()[0] || (await ctx.newPage());
    try {
      await pg.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await pg.waitForTimeout(6000);
      if (/\/login|authwall|\/uas\//.test(pg.url())) {
        throw new Error('링크드인 로그인이 필요합니다 — 창에서 로그인해 주세요');
      }

      // 「Start a post」 는 button 이 아니라 div 다 (2026-10-20 실측)
      await pg.locator(':is(button,div,span):is(:has-text("게시물 작성"),:has-text("Start a post"))')
              .last().click({ timeout: 25000 });
      await pg.waitForTimeout(4000);

      const box = pg.locator('dialog[open] div[contenteditable="true"]').first();
      await box.click({ timeout: 25000 });
      await pg.keyboard.insertText(text);
      await pg.waitForTimeout(2000);

      const len = await box.innerText().then((t) => t.length).catch(() => 0);
      console.log(`\n  링크드인: 본문 ${len}자를 채웠습니다.`);
      console.log('  창에서 파란 「Post」 버튼만 눌러 주세요.');
      console.log('  (링크드인이 자동 게시를 막습니다 — 마지막 클릭만 사람이 해야 통과합니다)\n');

      // 창을 닫지 않는다 — 사람이 누를 때까지 기다린다
      await new Promise((r) => ctx.on('close', r));
      return { ok: true, manual: true };
    } catch (e) {
      await ctx.close().catch(() => {});
      throw e;
    }
  },
};
