// 인스타그램 — 사진 1장 · 캐러셀 · 릴스(영상). 글만은 인스타가 안 받는다.
//
// 토큰이 두 종류라 들어가는 문 자체가 다르다.
//   IGAA…  인스타그램 로그인 토큰  → graph.instagram.com   (페이스북 페이지 없이도 됨)
//   EAA…   페이스북 로그인 토큰    → graph.facebook.com    (페이지에 연결된 비즈니스 계정)
// 둘 다 알아서 가려낸다.
import { env, missing } from '../env.mjs';

const hostFor = (tok) =>
  String(tok).startsWith('IGAA') ? 'https://graph.instagram.com/v21.0' : 'https://graph.facebook.com/v21.0';

async function j(url, opts) {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d?.error) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  return d;
}

export default {
  key: 'instagram',
  name: '인스타그램',
  caps: { text: false, image: true, video: true, link: false, maxText: 2200, maxMedia: 10, needsPublicUrl: true, needsMedia: true },
  needs: ['IG_USER_ID', 'META_ACCESS_TOKEN'],
  note: '사진이나 영상이 있어야 올라갑니다(글만은 불가).',

  ready() { return missing(this.needs); },

  /** 토큰이 살아 있는지, 어느 계정인지 */
  async whoami() {
    const e = env();
    const tok = e.META_ACCESS_TOKEN;
    return j(`${hostFor(tok)}/me?fields=id,username,account_type&access_token=${tok}`);
  },

  async post({ text, media = [], dry }) {
    if (!media.length) throw new Error('인스타그램은 사진이나 영상이 있어야 합니다');
    const e = env();
    const tok = e.META_ACCESS_TOKEN, uid = e.IG_USER_ID, G = hostFor(tok);
    if (dry) return { dry: true, would: media.length > 1 ? `캐러셀 ${media.length}장` : (media[0].kind === 'video' ? '릴스' : '사진 1장') };

    const mk = (p) => j(`${G}/${uid}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, access_token: tok }),
    }).then((d) => d.id);

    let creation;
    if (media.length === 1) {
      const m = media[0];
      creation = await mk(m.kind === 'video'
        ? { media_type: 'REELS', video_url: m.url, caption: text }
        : { image_url: m.url, caption: text });
    } else {
      const kids = [];
      for (const m of media) {
        kids.push(await mk(m.kind === 'video'
          ? { media_type: 'VIDEO', video_url: m.url, is_carousel_item: true }
          : { image_url: m.url, is_carousel_item: true }));
      }
      creation = await mk({ media_type: 'CAROUSEL', children: kids.join(','), caption: text });
    }

    await waitReady(G, creation, tok);
    const pub = await j(`${G}/${uid}/media_publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creation, access_token: tok }),
    });

    // 올라간 글의 진짜 주소를 받아온다
    let permalink;
    try { permalink = (await j(`${G}/${pub.id}?fields=permalink&access_token=${tok}`)).permalink; } catch {}
    return { id: pub.id, url: permalink };
  },
};

async function waitReady(G, id, tok, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const d = await j(`${G}/${id}?fields=status_code&access_token=${tok}`);
    if (d.status_code === 'FINISHED') return;
    if (d.status_code === 'ERROR') throw new Error('인스타그램이 파일을 처리하지 못했어요');
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error('처리가 너무 오래 걸립니다');
}
