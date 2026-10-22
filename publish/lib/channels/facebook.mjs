// 페이스북 페이지 — 글·링크·사진·영상. 개인 타임라인은 API 로 못 쓴다(페이지만).
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

const G = 'https://graph.facebook.com/v21.0';

async function j(url, opts) {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  return d;
}

export default {
  key: 'facebook',
  name: '페이스북 페이지',
  caps: { text: true, image: true, video: true, link: true, maxText: 5000, maxMedia: 10 },
  needs: ['FB_PAGE_ID', 'FB_PAGE_TOKEN'],
  note: '페이지 액세스 토큰이 필요합니다(개인 계정 담벼락은 API 로 못 올립니다).',

  ready() { return missing(this.needs); },

  async post({ text, media = [], link, dry }) {
    const e = env();
    const pid = e.FB_PAGE_ID, tok = e.FB_PAGE_TOKEN;
    if (dry) return { dry: true, would: media.length ? `${media[0].kind} + 글` : (link ? '링크 + 글' : '글만') };

    if (!media.length) {
      const d = await j(`${G}/${pid}/feed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, ...(link ? { link } : {}), access_token: tok }),
      });
      return { id: d.id, url: `https://www.facebook.com/${d.id}` };
    }

    const first = media[0];
    if (first.kind === 'video') {
      const fd = new FormData();
      fd.append('access_token', tok);
      fd.append('description', text);
      fd.append('source', new Blob([fs.readFileSync(first.path)]), first.name);
      const d = await j(`${G}/${pid}/videos`, { method: 'POST', body: fd });
      return { id: d.id };
    }
    // 사진 여러 장 → 먼저 올려두고(published=false) 한 게시물로 묶는다
    const ids = [];
    for (const m of media.filter((x) => x.kind === 'image')) {
      const d = await j(`${G}/${pid}/photos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: m.url, published: false, access_token: tok }),
      });
      ids.push(d.id);
    }
    const d = await j(`${G}/${pid}/feed`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        attached_media: ids.map((id) => ({ media_fbid: id })),
        access_token: tok,
      }),
    });
    return { id: d.id, url: `https://www.facebook.com/${d.id}` };
  },
};
