import { openBrowser } from '../../publish/naver-open.mjs';
const P = (...a) => console.log('  ' + a.join(' '));
const ctx = await openBrowser({ headless: true });
const pg = ctx.pages()[0] || (await ctx.newPage());
for (const no of ['224411513435', '224447202257']) {
  await pg.goto(`https://blog.naver.com/ianlove80/${no}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(4500);
  const f = pg.frames().find((fr) => /PostView|mainFrame/i.test(fr.url())) || pg.mainFrame();
  const r = await f.evaluate(() => {
    const t = document.body.innerText;
    const body = (document.querySelector('.se-content, .se-canvas, .se-main-container') || document.body).innerText;
    return {
      제목: (document.querySelector('.se-title-text, .pcol1') || {}).innerText?.replace(/\s+/g, ' ').trim().slice(0, 40) || '-',
      글자수: body.replace(/\s/g, '').length,
      이미지: document.querySelectorAll('.se-main-container img').length,
      날짜: (t.match(/20\d\d\. \d+\. \d+\.|\d+시간 전|\d+분 전/) || ['-'])[0],
      카테고리: (t.match(/\d\d [가-힣 ]{2,8}/) || ['-'])[0],
    };
  });
  P(`${no}  ${JSON.stringify(r, null, 0)}`);
}
await ctx.close().catch(() => {});
