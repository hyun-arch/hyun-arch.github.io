// 오픈빌더가 실제로 보내는 모양 그대로 넣어 본다.
import handler from './api/skill.js';

const req = (utterance, { callbackUrl = '', media = false } = {}) => ({
  method: 'POST',
  body: { userRequest: { utterance, callbackUrl, user: { id: 'u1' },
          ...(media ? { params: { media: { url: 'x' } } } : {}) } },
});
const res = () => { const o = {}; o.status = (c) => (o.code = c, o); o.json = (j) => (o.body = j, o); return o; };

const CASES = [
  ['안녕하세요',                      '인사 — 즉답'],
  ['아람휴비스는 어떤 회사예요?',      '회사 — 즉답'],
  ['릴라이가 뭔가요',                 '브랜드 — 즉답'],
  ['대리점 하고 싶은데요',            'B2B — 즉답'],
  ['주문한 거 언제 와요',             '쇼핑몰 — 즉답'],
  ['제 두피 사진 보내드릴게요',        '사진 — 막아야 함'],
  ['이거 탈모인가요?',                '의료 — 막아야 함'],
  ['지루성 두피염인데 효과 있나요',    '의료 — 막아야 함'],
  ['이 기기 얼마예요?',               '가격 — 막아야 함'],
  ['회사 작년 매출이 얼마죠',          '내부수치 — 막아야 함'],
];

let pass = 0;
for (const [q, label] of CASES) {
  const r = res();
  await handler(req(q), r);
  const t = r.body?.template?.outputs?.[0]?.simpleText?.text || (r.body?.useCallback ? '[콜백]' : '');
  const chips = (r.body?.template?.quickReplies || []).map((c) => c.label).join(', ');
  const first = t.split('\n')[0].slice(0, 46);
  console.log(`  ${label.padEnd(18)} → ${first}`);
  if (chips) console.log(`  ${' '.repeat(18)}   [${chips}]`);
  if (r.code === 200 && t) pass++;
}
console.log(`\n  ${pass}/${CASES.length} 응답 정상\n`);

// 사진이 첨부로 올 때(발화엔 안 보일 때)도 막히는지
const r2 = res();
await handler(req('이것 좀 봐주세요', { media: true }), r2);
console.log('  첨부 사진 → ' + r2.body.template.outputs[0].simpleText.text.split('\n')[0]);

// 콜백이 열려 있으면 먼저 "확인 중"을 보내는지
const r3 = res();
await handler(req('주차장 있나요', { callbackUrl: 'https://example.invalid/cb' }), r3);
console.log('  콜백 경로 → useCallback=' + r3.body.useCallback + ' / ' + (r3.body.data?.text || ''));
