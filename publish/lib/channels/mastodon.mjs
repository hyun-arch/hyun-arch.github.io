// 마스토돈 — 무료·오픈. 쓰는 서버에서 토큰 하나 발급하면 끝.
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

export default {
  key: 'mastodon',
  name: '마스토돈',
  caps: { text: true, image: true, video: true, link: true, maxText: 500, maxMedia: 4 },
  needs: ['MASTODON_HOST', 'MASTODON_ACCESS_TOKEN'],
  note: '내 서버 설정 → 개발 → 새 앱에서 토큰 발급. 무료, 심사 없음.',
  free: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    const base = (e.MASTODON_HOST || '').replace(/\/$/, '');
    const H = { Authorization: `Bearer ${e.MASTODON_ACCESS_TOKEN}` };
    if (dry) return { dry: true, would: media.length ? `${media.length}개 첨부 + 글` : '글만' };

    const ids = [];
    for (const m of media.slice(0, 4)) {
      const fd = new FormData();
      fd.append('file', new Blob([fs.readFileSync(m.path)]), m.name);
      const r = await fetch(`${base}/api/v2/media`, { method: 'POST', headers: H, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || '첨부 실패');
      ids.push(d.id);
    }
    const r = await fetch(`${base}/api/v1/statuses`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: text, ...(ids.length ? { media_ids: ids } : {}) }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
    return { id: d.id, url: d.url };
  },
};
