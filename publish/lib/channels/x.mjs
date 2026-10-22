// X(트위터) — 글·사진·영상. v2 API. 글쓰기는 유료 플랜이 필요하다(Basic 이상).
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

export default {
  key: 'x',
  name: 'X',
  caps: { text: true, image: true, video: true, link: true, maxText: 280, maxMedia: 4 },
  needs: ['X_ACCESS_TOKEN'],
  // 2026-02 부터 X 는 무료 등급을 없애고 건당 과금으로 바꿨다.
  //   글 1건 $0.015 · 링크가 들어간 글은 $0.20 (2026-09 기준)
  // 여기만 무료가 안 된다. 링크를 본문에서 빼면 13배 싸다.
  note: '2026년부터 건당 과금입니다 — 글 1건 약 20원, 링크 포함 글은 약 280원. 무료 등급 없음.',
  paid: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    const tok = e.X_ACCESS_TOKEN;
    if (dry) return { dry: true, would: media.length ? `${media.length}개 첨부 + 글` : '글만' };

    const ids = [];
    for (const m of media.slice(0, 4)) ids.push(await upload(m, tok));

    const r = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...(ids.length ? { media: { media_ids: ids } } : {}) }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.detail || d?.title || `HTTP ${r.status}`);
    return { id: d.data?.id, url: `https://x.com/i/web/status/${d.data?.id}` };
  },
};

async function upload(m, tok) {
  const fd = new FormData();
  fd.append('media', new Blob([fs.readFileSync(m.path)]), m.name);
  fd.append('media_category', m.kind === 'video' ? 'tweet_video' : 'tweet_image');
  const r = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST', headers: { Authorization: `Bearer ${tok}` }, body: fd,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('첨부 실패: ' + JSON.stringify(d).slice(0, 160));
  return d.data?.id || d.media_id_string;
}
