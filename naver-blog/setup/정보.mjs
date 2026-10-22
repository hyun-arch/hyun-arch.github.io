// 블로그 정보: 소개글 교체 + 프로필 이미지
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, saveCookies } from '../../publish/naver-open.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'categories.json'), 'utf8'));
const P = (...a) => { const s = '  ' + a.join(' '); console.log(s); try { fs.appendFileSync('/tmp/info.log', s + '\n'); } catch {} };
const ctx = await openBrowser({ headless: false });
const pg = ctx.pages()[0] || (await ctx.newPage());
await pg.goto(`https://admin.blog.naver.com/${CFG.blogId}/config/bloginfo`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(9000);
await saveCookies(ctx);
P('주소: ' + pg.url());

// 본문이 iframe 인지 확인
let F = pg.mainFrame();
for (const fr of pg.frames()) {
  const n = await fr.evaluate(() => document.querySelectorAll('textarea, input[type=text]').length).catch(() => 0);
  if (n > 2) { F = fr; break; }
}
P('작업 프레임: ' + (F.url() || '메인').slice(-50));

const fields = await F.evaluate(() => ({
  textareas: [...document.querySelectorAll('textarea')].map((t) => ({ id: t.id, name: t.name, v: (t.value || '').slice(0, 40) })),
  texts: [...document.querySelectorAll('input[type=text]')].map((i) => ({ id: i.id, name: i.name, v: (i.value || '').slice(0, 30) })),
  files: [...document.querySelectorAll('input[type=file]')].map((i) => ({ id: i.id, name: i.name })),
  btns: [...new Set([...document.querySelectorAll('a,button,input[type=submit]')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || e.value || '').trim()).filter((t) => t && t.length < 14))],
}));
P('textarea: ' + JSON.stringify(fields.textareas));
P('text: ' + JSON.stringify(fields.texts).slice(0, 300));
P('file: ' + JSON.stringify(fields.files));
P('버튼: ' + fields.btns.join(' | ').slice(0, 200));
P('blogname 값: ' + JSON.stringify(await F.evaluate(() => (document.getElementById('blogname') || {}).value)));
const all = await F.evaluate(() => [...document.querySelectorAll('textarea,[contenteditable="true"]')].map((e) => ({ tag: e.tagName, id: e.id, cls: (e.className||'').toString().slice(0,24), v: (e.value || e.innerText || '').slice(0, 50) })));
P('긴 입력칸: ' + JSON.stringify(all));
await pg.screenshot({ path: '/tmp/info.png', fullPage: true }).catch(() => {});
await ctx.close().catch(() => {});
