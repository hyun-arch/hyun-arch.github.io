#!/usr/bin/env node
// 발행된 글을 지운다. 되돌릴 수 없다.
//   node publish/delete-post.mjs <글번호> [<글번호> …]
// 지우기 전에 제목을 읽어 보여 주고, 지운 뒤 사라졌는지 확인한다.
import { openBrowser } from './naver-open.mjs';
import { env } from './lib/env.mjs';

const blogId = env().NAVER_BLOG_ID;
const nos = process.argv.slice(2);
if (!nos.length) { console.log('글번호를 주세요.'); process.exit(1); }

const ctx = await openBrowser({ headless: true });
try {
  const pg = ctx.pages()[0] || (await ctx.newPage());
  for (const no of nos) {
    // 1) 무엇을 지우는지 먼저 읽는다
    await pg.goto(`https://blog.naver.com/${blogId}/${no}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(3000);
    let title = '';
    for (const fr of pg.frames()) {
      title = await fr.evaluate(() => {
        const t = document.querySelector('.se-title-text, .pcol1 .itemSubjectBoldfont');
        return t ? (t.innerText || '').trim().replace(/\s+/g, ' ') : '';
      }).catch(() => '');
      if (title) break;
    }
    console.log(`\n  지울 글  ${no}  「${title || '제목 못 읽음'}」`);

    // 2) 관리 화면에서 지운다
    await pg.goto(`https://blog.naver.com/PostThumbnailAlbumView.naver?blogId=${blogId}`,
                  { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    const delUrl = `https://blog.naver.com/BlogDeletePost.naver?blogId=${blogId}&logNo=${no}`;
    await pg.goto(delUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(2500);
    // 확인 창이 뜨면 누른다
    pg.on('dialog', (d) => d.accept().catch(() => {}));
    for (const label of ['삭제', '확인']) {
      const b = pg.locator(`button:has-text("${label}"), a:has-text("${label}")`).first();
      if (await b.isVisible({ timeout: 1500 }).catch(() => false)) {
        await b.click().catch(() => {});
        await pg.waitForTimeout(2000);
      }
    }

    // 3) 정말 사라졌는지 확인한다
    await pg.goto(`https://blog.naver.com/${blogId}/${no}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pg.waitForTimeout(2500);
    let gone = true;
    for (const fr of pg.frames()) {
      const has = await fr.evaluate(() => !!document.querySelector('.se-main-container')).catch(() => false);
      if (has) { gone = false; break; }
    }
    console.log(gone ? `  ✓ 지워졌습니다` : `  ✗ 아직 남아 있습니다 — 수동으로 지워야 합니다`);
  }
} finally { await ctx.close().catch(() => {}); }
