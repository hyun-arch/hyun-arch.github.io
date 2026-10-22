/* 올린 글 4개를 제자리 카테고리로 옮긴다.
 * 네이버 블로그 [관리 > 글 관리] 화면 콘솔에 붙여넣고 Enter. */
(async () => {
  const MOVE = [
    ['머스크에게 배운 것', '31 서재'],
    ['릴라이 2차 네이버 라이브커머스', '12 릴라이'],
    ['나를 구하는 유일한 길은', '11 진단 이야기'],
    ['일론 머스크와 스페이스X', '31 서재'],
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;width:300px;background:#15171a;color:#f3f3f1;font:13px/1.6 -apple-system,"Apple SD Gothic Neo",sans-serif;padding:14px 16px;border-radius:12px';
  box.innerHTML = '<b style="color:#8fb3e0">글 옮기기</b><div id="_m" style="margin-top:8px"></div>';
  document.body.appendChild(box);
  const say = (t, c) => { const d = document.createElement('div'); d.textContent = t; if (c) d.style.color = c; box.querySelector('#_m').appendChild(d); };

  let n = 0;
  for (const [title, cat] of MOVE) {
    const row = [...document.querySelectorAll('tr, li')].find((e) => (e.innerText || '').includes(title.slice(0, 12)));
    if (!row) { say('못 찾음: ' + title.slice(0, 14), '#ff9a8a'); continue; }
    const cb = row.querySelector('input[type=checkbox]');
    if (cb && !cb.checked) { cb.click(); n++; say('선택: ' + title.slice(0, 16), '#9fe0b3'); }
  }
  if (!n) { say('선택된 글이 없습니다.', '#ff9a8a'); return; }
  say('');
  say(n + '개 선택했습니다.', '#8fb3e0');
  say('[이동] 누르고 카테고리를 고르세요.', '#f3f3f1');
})();
