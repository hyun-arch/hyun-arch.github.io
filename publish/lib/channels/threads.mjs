// 스레드 — 공식 Threads API. 글·사진·영상.
// 사진·영상은 "공개 URL"이어야 해서, media.mjs 가 gh-pages 로 먼저 올린다.
import { env, missing } from '../env.mjs';

const G = 'https://graph.threads.net/v1.0';

async function j(url, opts) {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  return d;
}

export default {
  key: 'threads',
  name: '스레드',
  caps: { text: true, image: true, video: true, link: true, maxText: 500, maxMedia: 20, needsPublicUrl: true },
  needs: ['THREADS_USER_ID', 'THREADS_ACCESS_TOKEN'],
  note: 'Meta 개발자 앱에서 Threads API 권한(threads_basic, threads_content_publish)을 켜야 합니다.',

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    const uid = e.THREADS_USER_ID, tok = e.THREADS_ACCESS_TOKEN;
    if (dry) return { dry: true, would: media.length ? `${media[0].kind} + 글 ${[...text].length}자` : `글 ${[...text].length}자` };

    const mk = async (params) =>
      (await j(`${G}/${uid}/threads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, access_token: tok }),
      })).id;

    let creation;
    if (!media.length) {
      creation = await mk({ media_type: 'TEXT', text });
    } else if (media.length === 1) {
      const m = media[0];
      creation = await mk(m.kind === 'video'
        ? { media_type: 'VIDEO', video_url: m.url, text }
        : { media_type: 'IMAGE', image_url: m.url, text });
    } else {
      const kids = [];
      for (const m of media) {
        kids.push(await mk(m.kind === 'video'
          ? { media_type: 'VIDEO', video_url: m.url, is_carousel_item: true }
          : { media_type: 'IMAGE', image_url: m.url, is_carousel_item: true }));
      }
      creation = await mk({ media_type: 'CAROUSEL', children: kids.join(','), text });
    }

    // 영상은 인코딩에 시간이 걸린다 — 준비될 때까지 기다린다
    if (media.some((m) => m.kind === 'video')) await waitReady(creation, tok);

    const pub = await j(`${G}/${uid}/threads_publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creation, access_token: tok }),
    });
    return { id: pub.id, url: `https://www.threads.net/@me/post/${pub.id}` };
  },
};

async function waitReady(id, tok, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const d = await j(`${G}/${id}?fields=status&access_token=${tok}`);
    if (d.status === 'FINISHED') return;
    if (d.status === 'ERROR') throw new Error('영상 처리 실패');
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error('영상 처리가 너무 오래 걸립니다');
}
