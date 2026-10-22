#!/usr/bin/env node
// 에디터에 이미지를 넣는 세 가지 길. 버튼이 막힐 때 쓴다.
//
//   ① 클립보드 Cmd+V      — 사람과 같은 길. 보이는 창에서만 확실하다
//   ② DataTransfer drop   — 브라우저 안에서 드롭 이벤트를 만든다. 헤드리스에서도 된다
//   ③ 파일 input 주입     — 숨은 input 을 찾아 setInputFiles
//
// 2026-10-22: 사진 버튼을 여덟 번 시도했고 매번 다른 것이 막았다.
//   선택자 · 도움말 패널 · 딤 · 다시 뜬 도움말.
//   버튼을 누르지 않는 길을 따로 둔다.
import fs from 'node:fs';

/** ② DataTransfer 로 drop 이벤트를 만든다. 버튼도 클립보드도 안 탄다. */
export async function dropImage(frame, page, filePath) {
  const buf = fs.readFileSync(filePath);
  const b64 = buf.toString('base64');
  const name = filePath.split('/').pop();
  return frame.evaluate(async ({ b64, name }) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const file = new File([arr], name, { type: 'image/png' });

    const dt = new DataTransfer();
    dt.items.add(file);

    const target = document.querySelector('.se-main-container [contenteditable="true"]')
      || document.querySelector('[contenteditable="true"]')
      || document.querySelector('.se-main-container');
    if (!target) return { 됐나: false, 이유: '본문 칸 없음' };

    // 붙여넣기로도 한 번, 드롭으로도 한 번 — 에디터가 받는 쪽으로 들어간다
    target.focus();
    target.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true, cancelable: true, clipboardData: dt,
    }));
    await new Promise((r) => setTimeout(r, 1200));
    target.dispatchEvent(new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer: dt,
    }));
    return { 됐나: true };
  }, { b64, name });
}

/** ③ 숨은 file input 을 찾아 직접 넣는다. */
export async function injectFile(frame, page, filePath) {
  const n = await frame.locator('input[type=file]').count().catch(() => 0);
  if (!n) return { 됐나: false, 이유: 'file input 없음' };
  await frame.locator('input[type=file]').first().setInputFiles(filePath);
  await page.waitForTimeout(4000);
  return { 됐나: true };
}
