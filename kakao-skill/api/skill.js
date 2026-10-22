// 오픈빌더가 때리는 자리. 이 주소를 블록의 스킬 URL 로 넣는다.
//
// 카카오는 5초 안에 답을 못 받으면 끊는다. 그래서 두 갈래로 간다.
//   · 지식에서 바로 찾히면  → 그 자리에서 답한다 (0.1초)
//   · 모델에게 물어야 하면  → "확인 중"을 먼저 보내고, 콜백으로 진짜 답을 민다
import { parse, text, pending, sendCallback } from '../lib/kakao.js';
import { screen, sanitize } from '../lib/guard.js';
import { match, FALLBACK_CHIPS } from '../lib/kb.js';
import { ask } from '../lib/llm.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { utterance, callbackUrl, hasMedia } = parse(body);

  // 1) 답하면 안 되는 질문부터 거른다 — 가장 먼저, 가장 빠르게
  const g = screen(utterance, hasMedia);
  if (g.block) return res.status(200).json(text(g.text, g.chips));

  // 2) 아는 질문이면 즉답
  const hit = match(utterance);
  if (hit) return res.status(200).json(text(hit.a, hit.chips));

  // 3) 모르는 질문 — 콜백이 열려 있으면 모델에게 넘긴다
  if (callbackUrl) {
    const work = (async () => {
      try {
        const a = sanitize(await ask(utterance));
        await sendCallback(callbackUrl, text(a, FALLBACK_CHIPS));
      } catch {
        await sendCallback(callbackUrl, text(
          '죄송해요, 제가 바로 답하기 어려운 질문이에요. 담당자에게 연결해 드릴게요.',
          ['상담 연결', '무슨 제품을 만들어요?']
        )).catch(() => {});
      }
    })();
    // Vercel 에서는 응답 후에도 일을 마치도록 waitUntil 로 붙잡아 둔다
    try {
      const { waitUntil } = await import('@vercel/functions');
      waitUntil(work);
    } catch { /* 로컬·다른 환경에서는 그냥 떠 있는 동안 끝난다 */ }
    return res.status(200).json(pending('확인하고 있어요. 잠시만요.'));
  }

  // 4) 콜백도 없으면 사람에게 넘긴다
  return res.status(200).json(text(
    '제가 아직 모르는 질문이에요. 담당자에게 연결해 드릴게요.',
    FALLBACK_CHIPS
  ));
}
