/* 이안사랑 — 카테고리 15개 자동 생성
 * 네이버 블로그 [관리] 화면에서 콘솔에 붙여넣고 Enter. */
(async () => {
  const PLAN = [
    ['01 아람비즈니스', ['11 진단 이야기', '12 릴라이', '13 현장 기록']],
    ['02 여행', ['21 유럽', '22 아시아', '23 준비와 짐']],
    ['03 읽고 생각한 것', ['31 서재', '32 생각 조각']],
    ['04 함께하는 사람들', ['41 셀피쉬클럽', '42 스폰지클럽', '43 공유회']],
  ];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;width:300px;max-height:60vh;overflow:auto;background:#15171a;color:#f3f3f1;font:13px/1.6 -apple-system,"Apple SD Gothic Neo",sans-serif;padding:14px 16px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35)';
  box.innerHTML = '<b style="color:#8fb3e0">카테고리 생성</b><div id="_lg" style="margin-top:8px"></div>';
  document.body.appendChild(box);
  const say = (t, c) => { const d = document.createElement('div'); d.textContent = t; if (c) d.style.color = c; box.querySelector('#_lg').appendChild(d); };

  const docs = () => {
    const out = [document];
    for (const fr of document.querySelectorAll('iframe')) { try { if (fr.contentDocument) out.push(fr.contentDocument); } catch {} }
    return out;
  };
  const find = (words, tags = 'button,a,span,li,label') => {
    for (const d of docs())
      for (const el of d.querySelectorAll(tags)) {
        const t = (el.innerText || el.value || '').replace(/\s+/g, '');
        if (words.some((w) => t === w.replace(/\s+/g, '')) && el.offsetParent !== null) return el;
      }
    return null;
  };
  const addButton = () => find(['카테고리추가', '카테고리 추가'], 'button,a,input[type=button]');

  // 카테고리 화면이 아니면 찾아 들어간다
  if (!addButton()) {
    const nav = find(['메뉴·글·동영상 관리', '메뉴·글·동영상관리', '메뉴글동영상관리'], 'a,button');
    if (nav) { nav.click(); say('메뉴·글·동영상 관리로 이동', '#aab'); await wait(2500); }
    const blog = find(['블로그'], 'a,button');
    if (blog && !addButton()) { blog.click(); say('블로그 탭으로 이동', '#aab'); await wait(2500); }
  }

  if (!addButton()) {
    say('카테고리 화면을 못 찾았습니다.', '#ff9a8a');
    say('관리 > 메뉴·글·동영상 관리 > 블로그 로 간 뒤 다시 붙여넣어 주세요.', '#aab');
    console.log('보이는 버튼:', [...new Set(docs().flatMap((d) => [...d.querySelectorAll('button,a')].map((e) => (e.innerText || '').trim()).filter((s) => s && s.length < 20)))]);
    return;
  }

  const type = (el, v) => {
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const lastInput = () => {
    for (const d of docs()) {
      const l = [...d.querySelectorAll('input[type=text]')].filter((i) => i.offsetParent !== null);
      if (l.length) return l[l.length - 1];
    }
    return null;
  };

  let made = 0;
  for (const [parent, kids] of PLAN) {
    addButton().click(); await wait(700);
    const i1 = lastInput();
    if (i1) { type(i1, parent); made++; say('+ ' + parent, '#9fe0b3'); }
    await wait(500);
    for (const kid of kids) {
      const p = find([parent]);
      if (p) { p.click(); await wait(400); }
      (find(['하위 카테고리 추가', '하위카테고리추가'], 'button,a') || addButton()).click();
      await wait(700);
      const i2 = lastInput();
      if (i2) { type(i2, kid); made++; say('　+ ' + kid, '#9fe0b3'); }
      await wait(500);
    }
  }
  say('');
  say(made + '개 입력 완료 — 아래 [확인] 누르면 저장됩니다.', '#8fb3e0');
})();
