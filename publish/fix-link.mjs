#!/usr/bin/env node
// 발행된 글의 「괄호 맨텍스트 링크」를 진짜 링크로 고친다.
//   node publish/fix-link.mjs <logNo> "<찾을 이름>" "<넣을 주소>"
//
// 왜 — tonaver.mjs 가 마크다운 링크를 `이름 (주소)` 글자로 바꾸고 있었다.
// 글자는 남고 링크는 아니다. 발행된 4편 전부 진짜 링크가 0개였다. (2026-10-20)
// 네이버는 줄에 주소만 홀로 있으면 자동으로 링크를 건다.
import fs from 'node:fs';
import { chromium } from 'playwright';

const COOK = '/Users/aram/Desktop/project/14. 나만의 os/аram';
const COOKIE = '/Users/aram/Desktop/project/14. 나만의 os/아람미러(hyun-arch.github.io)/publish/.naver-cookies.json';
const [logNo, 이름, 주소] = process.argv.slice(2);

const b = await chromium.launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 }, locale: 'ko-KR' });
await ctx.addCookies(JSON.parse(fs.readFileSync(COOKIE, 'utf8')));
const pg = await ctx.newPage();
pg.on('dialog', async (d) => { console.log('  알림:', d.message().slice(0, 50)); await d.accept().catch(()=>{}); });
try {
  await pg.goto(`https://blog.naver.com/ianlove80/postwrite?logNo=${logNo}&redirect=Update`,
                { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pg.waitForTimeout(12000);
  if (/nidlogin/.test(pg.url())) throw new Error('로그인이 풀렸습니다');

  // 도움말 패널이 열려 있으면 닫는다
  await pg.evaluate(() => {
    document.querySelectorAll('button,a').forEach(e => {
      const l = (e.getAttribute('aria-label') || e.className || '').toString();
      if (/close|닫기/i.test(l)) e.click();
    });
  }).catch(()=>{});
  await pg.waitForTimeout(2000);

  const 찾음 = await pg.evaluate((n) => {
    const c = document.querySelector('.se-main-container');
    if (!c) return { 있나: false, 이유: '본문 못 찾음' };
    const t = c.innerText || '';
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(https:\\/\\/blog\\.naver\\.com\\/ianlove80\\)');
    return { 있나: re.test(t), 본문길이: t.length };
  }, 이름);
  console.log('고칠 자리:', JSON.stringify(찾음));
  await pg.screenshot({ path: '/tmp/fix-1.png' });

  if (!찾음.있나) { console.log('  고칠 것이 없습니다.'); process.exit(0); }
  console.log(`\n  수정 화면을 열어 두었습니다.`);
  console.log(`  「${이름} (https://blog.naver.com/ianlove80)」 에서 괄호를 지우고,`);
  console.log(`  그 문단 끝에 이 줄을 넣어 주세요:\n    ${주소}\n`);
  await new Promise(() => {});
} catch (e) {
  console.log('멈춤:', e.message.split('\n')[0].slice(0, 60));
  await b.close().catch(()=>{});
}
