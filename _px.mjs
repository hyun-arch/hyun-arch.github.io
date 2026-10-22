// Perplexity 에 물어보고 답변과 출처를 가져온다 (로그인 없이 되는지 확인)
import { chromium } from 'playwright';
const q = process.argv[2];
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  locale: 'ko-KR',
});
const pg = await ctx.newPage();
try {
  await pg.goto('https://www.perplexity.ai/search?q=' + encodeURIComponent(q),
                { waitUntil: 'domcontentloaded', timeout: 45000 });
  await pg.waitForTimeout(15000);
  const r = await pg.evaluate(() => ({
    주소: location.href.slice(0, 60),
    본문: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 600),
    링크: [...document.querySelectorAll('a[href^="http"]')]
      .map(a => a.href).filter(h => !/perplexity/.test(h)).slice(0, 12),
  }));
  console.log(JSON.stringify(r, null, 1));
} catch (e) { console.log('실패:', e.message.split('\n')[0].slice(0, 70)); }
finally { await b.close().catch(()=>{}); }
