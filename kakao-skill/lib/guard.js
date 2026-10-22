// 아람휴비스라서 꼭 막아야 하는 것들.
//
// 1) 효능·진단 답변 금지 — 의료기기법·광고심의 문제가 된다.
//    "탈모인가요?" "이거 쓰면 나아지나요?" 에 봇이 답하면 안 된다.
// 2) 사진 처리 금지 — 두피 사진은 민감한 개인정보다.
//    받는 순간 보관·파기 책임이 생기고, 외부 모델로 넘기면 더 커진다.
// 3) 가격·견적은 담당자에게 — 공개 단가가 없다.

const MEDICAL = [
  '탈모', '탈모약', '모낭', '병원', '피부과', '진료', '처방', '약',
  '치료', '낫', '나아', '효과 있', '효능', '부작용', '증상', '질환',
  '염증', '지루성', '건선', '아토피', '두피염', '진단해', '진단 좀',
  '봐주', '봐 주', '어떤가요', '정상인가', '심한가',
];
const PHOTO = ['사진', '이미지', '찍어', '보내드릴', '첨부', '사진으로'];
const PRICE = ['얼마', '가격', '단가', '견적', '비용', '할인', '최저가'];
// '매출이 얼마냐' 같은 회사 질문은 가격 안내로 새면 안 된다 — 그건 아예 답할 것이 아니다
const NOT_PRICE = ['매출', '실적', '영업이익', '주가', '시가총액', '연봉', '직원 수'];

const hit = (t, list) => list.some((k) => t.includes(k));

export const HANDOFF = {
  medical:
    '죄송해요, 두피·피부 상태나 효과에 대한 판단은 제가 답해드릴 수 없어요.\n' +
    '정확한 건 전문가가 직접 봐야 해서, 담당자에게 연결해 드릴게요.\n\n' +
    '상담 남기기 → 아래 버튼을 눌러주세요.',
  photo:
    '사진은 이 채팅에서 받지 않고 있어요. 개인정보라 더 안전한 곳에서 다뤄요.\n' +
    '두피 진단은 릴라이 매장이나 전용 기기로 받으실 수 있어요.\n\n' +
    '가까운 곳을 안내해 드릴까요?',
  price:
    '제품 가격과 견적은 쓰시는 환경에 따라 달라져서, 담당자가 직접 안내드려요.\n' +
    '문의 남겨주시면 영업일 기준 하루 안에 연락드릴게요.',
};

/**
 * 답하면 안 되는 질문인지 먼저 거른다.
 * @returns {{block:true, reason:string, text:string, chips:string[]} | {block:false}}
 */
export function screen(utterance, hasMedia = false) {
  const t = String(utterance || '');

  if (hasMedia || hit(t, PHOTO)) {
    return { block: true, reason: 'photo', text: HANDOFF.photo,
             chips: ['매장 안내', '릴라이가 뭐예요?', '상담 연결'] };
  }
  if (hit(t, MEDICAL)) {
    return { block: true, reason: 'medical', text: HANDOFF.medical,
             chips: ['상담 연결', '제품이 궁금해요', '매장 안내'] };
  }
  if (hit(t, NOT_PRICE)) {
    return { block: true, reason: 'internal',
             text: '회사 내부 수치는 제가 안내해 드리지 않아요.\n제품이나 서비스에 대해 궁금한 점을 물어봐 주세요.',
             chips: ['무슨 제품을 만들어요?', '릴라이가 뭐예요?', '상담 연결'] };
  }
  if (hit(t, PRICE)) {
    return { block: true, reason: 'price', text: HANDOFF.price,
             chips: ['상담 연결', '무슨 제품을 만들어요?'] };
  }
  return { block: false };
}

/** 모델이 만든 답에 금지 표현이 섞였는지 마지막으로 한 번 더 본다 */
export function sanitize(answer) {
  const t = String(answer || '');
  if (hit(t, ['치료', '완치', '효능', '처방', '진단 결과', '질환'])) {
    return HANDOFF.medical;
  }
  return t;
}
