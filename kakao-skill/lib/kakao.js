// 카카오 오픈빌더가 주고받는 모양.
// 오는 것:  { userRequest: { utterance, callbackUrl, user: { id } }, ... }
// 가는 것:  { version: "2.0", template: { outputs: [...], quickReplies: [...] } }

export const text = (t, chips = []) => ({
  version: '2.0',
  template: {
    outputs: [{ simpleText: { text: String(t).slice(0, 1000) } }],
    ...(chips.length ? { quickReplies: chips.slice(0, 10).map((c) => ({
      label: String(c).slice(0, 14), action: 'message', messageText: c,
    })) } : {}),
  },
});

/** 5초를 넘길 것 같을 때 — "먼저 이것부터 보내고, 답은 곧 따로 보냅니다" */
export const pending = (t = '확인하고 있어요. 잠시만요.') => ({
  version: '2.0',
  useCallback: true,
  data: { text: t },
});

/** 콜백 주소로 최종 답을 밀어 넣는다 */
export async function sendCallback(url, payload) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('콜백 실패 HTTP ' + r.status);
  return true;
}

/** 들어온 요청에서 쓸 것만 꺼낸다 */
export function parse(body) {
  const u = body?.userRequest || {};
  return {
    utterance: (u.utterance || '').trim(),
    callbackUrl: u.callbackUrl || '',
    userId: u.user?.id || '',
    // 카카오는 사진을 보내면 발화에 담지 않고 별도 타입으로 준다
    hasMedia: !!(u.params?.media || u.params?.image || /^사진|^이미지/.test(u.type || '')),
  };
}
