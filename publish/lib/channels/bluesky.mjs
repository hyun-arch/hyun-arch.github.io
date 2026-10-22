// 블루스카이 — 심사 없음, 완전 무료. 앱 비밀번호 하나면 오늘 바로 된다.
// 글·사진(최대 4장)·영상. AT 프로토콜.
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

const PDS = 'https://bsky.social';

async function j(url, opts) {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
  return d;
}

export default {
  key: 'bluesky',
  name: '블루스카이',
  caps: { text: true, image: true, video: true, link: true, maxText: 300, maxMedia: 4, maxMediaMB: 50 },
  needs: ['BSKY_HANDLE', 'BSKY_APP_PASSWORD'],
  note: '설정 → 앱 비밀번호에서 만들면 끝. 심사도 비용도 없습니다.',
  free: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    if (dry) return { dry: true, would: media.length ? `${media.length}개 첨부 + 글` : '글만' };

    const s = await j(`${PDS}/xrpc/com.atproto.server.createSession`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: e.BSKY_HANDLE, password: e.BSKY_APP_PASSWORD }),
    });
    const H = { Authorization: `Bearer ${s.accessJwt}` };

    const blobs = [];
    for (const m of media.slice(0, 4)) {
      const b = await j(`${PDS}/xrpc/com.atproto.repo.uploadBlob`, {
        method: 'POST', headers: { ...H, 'Content-Type': m.kind === 'video' ? 'video/mp4' : 'image/*' },
        body: fs.readFileSync(m.path),
      });
      blobs.push({ blob: b.blob, kind: m.kind, alt: m.name });
    }

    const record = { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString(), ...facets(text) };
    const imgs = blobs.filter((b) => b.kind === 'image');
    const vid = blobs.find((b) => b.kind === 'video');
    if (vid) record.embed = { $type: 'app.bsky.embed.video', video: vid.blob };
    else if (imgs.length) record.embed = { $type: 'app.bsky.embed.images', images: imgs.map((b) => ({ image: b.blob, alt: b.alt })) };

    const d = await j(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post', record }),
    });
    const rkey = d.uri.split('/').pop();
    return { id: d.uri, url: `https://bsky.app/profile/${e.BSKY_HANDLE}/post/${rkey}` };
  },
};

// 링크를 눌리게 만든다(블루스카이는 바이트 위치를 직접 줘야 한다)
function facets(text) {
  const enc = new TextEncoder();
  const out = [];
  const re = /https?:\/\/[^\s]+/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({
      index: { byteStart: enc.encode(text.slice(0, m.index)).length,
               byteEnd: enc.encode(text.slice(0, m.index + m[0].length)).length },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }],
    });
  }
  return out.length ? { facets: out } : {};
}
