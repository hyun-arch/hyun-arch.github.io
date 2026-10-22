// 살아 있는지 확인용. 오픈빌더 등록 전에 이 주소부터 열어 보면 된다.
import { KB } from '../lib/kb.js';
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: '아람휴비스 카카오톡 스킬 서버',
    knowledge: KB.length,
    model: process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash') : '키 없음(지식 응답만)',
    at: new Date().toISOString(),
  });
}
