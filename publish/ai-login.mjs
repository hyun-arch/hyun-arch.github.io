#!/usr/bin/env node
// GEO 측정용 AI 서비스 로그인 창. 탭 세 개를 띄운다.
//   node publish/ai-login.mjs
//
// 왜 전용 브라우저인가: 부사장님 크롬을 건드리지 않는다.
// 로그인은 사람이 하고, 비밀번호는 보지도 저장하지도 않는다.
// 쿠키는 이 브라우저가 자기 폴더에 들고 있다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILE = path.join(HERE, '.browser-ai');

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: null,
  args: ['--no-sandbox', '--window-size=1500,1000'],
  locale: 'ko-KR',
});

const 탭 = [
  ['Perplexity', 'https://www.perplexity.ai/'],
  ['ChatGPT',    'https://chatgpt.com/'],
  ['Gemini',     'https://gemini.google.com/'],
];
for (const [name, url] of 탭) {
  const pg = ctx.pages().find(p => p.url() === 'about:blank') || await ctx.newPage();
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
}

console.log(`
  ────────────────────────────────────────────────
   탭 3개를 띄웠습니다. 각각 로그인해 주세요.

     탭1  Perplexity   ← 출처를 보여줘서 측정에 제일 좋습니다
     탭2  ChatGPT
     탭3  Gemini

   로그인되면 창을 그대로 두세요. 제가 질문 20개를 돌립니다.
   ※ 비밀번호는 제가 보지도 저장하지도 않습니다.
  ────────────────────────────────────────────────
`);
// 창이 죽어도 로그인이 남게 (네이버에서 겪은 일 — 2026-10-20)
const 저장 = setInterval(() => {}, 15000);
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { clearInterval(저장); process.exit(0); });
await new Promise((r) => ctx.on('close', r));
