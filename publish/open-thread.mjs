#!/usr/bin/env node
// 스레드 글을 열어 둔다. 손으로 고칠 것이 있을 때.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ctx = await chromium.launchPersistentContext(path.join(HERE, '.browser-sns'),
  { headless: false, viewport: null, locale: 'ko-KR', args: ['--window-size=1400,1000'] });
const pg = ctx.pages()[0] || await ctx.newPage();
await pg.goto(process.argv[2] || 'https://www.threads.com/@ianlove99/post/Detn7l1IMdC',
              { waitUntil: 'domcontentloaded', timeout: 60000 });
await pg.waitForTimeout(6000);
await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
console.log('\n  맨 아래 @spongeclub.ai 답글의 ⋯ → 삭제 를 눌러 주세요.\n');
await new Promise(() => {});
