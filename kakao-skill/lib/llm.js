// 지식에서 못 찾은 질문만 모델에게 넘긴다.
// 공개 정보 범위를 벗어나거나 확실하지 않으면 "담당자 연결"로 답하게 묶어둔다.
import { KB } from './kb.js';

const SYSTEM =
  '너는 아람휴비스의 카카오톡 상담봇이다. 아래 규칙을 반드시 지켜라.\n' +
  '1) 아는 것만 답한다. 모르면 "담당자에게 연결해 드릴게요"라고 말한다. 지어내지 마라.\n' +
  '2) 두피·피부 상태 판단, 질환, 효능, 치료, 부작용에 대해서는 절대 답하지 마라. 담당자에게 넘겨라.\n' +
  '3) 가격·견적·단가는 말하지 마라. 담당자 안내로 넘겨라.\n' +
  '4) 매출·내부자료·고객사 이름은 말하지 마라.\n' +
  '5) 세 문장 안으로, 존댓말로, 쉽게 답하라.\n\n' +
  '참고 자료:\n' + KB.map((e) => '- ' + e.a.replace(/\n+/g, ' ')).join('\n');

export async function ask(utterance, env = process.env) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY 없음');
  const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ parts: [{ text: utterance }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
      }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  const out = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!out) throw new Error('빈 응답');
  return out;
}
