// 틱톡 — 영상.
//
// 두 가지 길이 있고, 기본은 "심사 없이 되는 쪽"이다.
//   inbox  (기본)  : 심사 없이 됨. 영상이 틱톡 앱 '초안함'에 도착하고, 톡 눌러서 올리면 끝.
//                   scope: video.upload
//   direct         : 앱 심사를 통과했을 때만. 바로 피드에 올라간다.
//                   scope: video.publish  (심사 전에는 비공개로만 올라감)
// TIKTOK_MODE=direct 로 바꾸면 두 번째 길을 쓴다.
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

const API = 'https://open.tiktokapis.com/v2';

async function j(url, opts) {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || (d?.error && d.error.code !== 'ok')) throw new Error(d?.error?.message || `HTTP ${r.status}`);
  return d;
}

export default {
  key: 'tiktok',
  name: '틱톡',
  caps: { text: false, image: false, video: true, link: false, maxText: 2200, maxMedia: 1, needsMedia: true },
  needs: ['TIKTOK_ACCESS_TOKEN'],
  note: '기본은 초안함 넣기 — 심사 없이 무료로 됩니다(앱에서 톡 눌러 발행). 심사를 통과했으면 TIKTOK_MODE=direct.',
  free: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const v = media.find((m) => m.kind === 'video');
    if (!v) throw new Error('틱톡은 영상 파일이 필요합니다');
    const e = env();
    const direct = e.TIKTOK_MODE === 'direct';
    if (dry) return { dry: true, would: direct ? `${v.name} → 바로 발행` : `${v.name} → 틱톡 초안함(심사 불필요)` };

    const H = { Authorization: `Bearer ${e.TIKTOK_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
    const endpoint = direct ? `${API}/post/publish/video/init/` : `${API}/post/publish/inbox/video/init/`;

    // 파일을 직접 올린다 — 공개 URL 도, 도메인 인증도 필요 없다
    const size = v.bytes;
    const init = await j(endpoint, {
      method: 'POST', headers: H,
      body: JSON.stringify({
        ...(direct ? { post_info: { title: text.slice(0, 2200), privacy_level: e.TIKTOK_PRIVACY || 'SELF_ONLY' } } : {}),
        source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: size, total_chunk_count: 1 },
      }),
    });

    const up = init.data?.upload_url;
    if (!up) throw new Error('업로드 주소를 못 받았어요');
    const put = await fetch(up, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes 0-${size - 1}/${size}` },
      body: fs.readFileSync(v.path),
    });
    if (!put.ok) throw new Error('영상 업로드 실패: HTTP ' + put.status);

    return direct
      ? { id: init.data.publish_id }
      : { id: init.data.publish_id, inbox: true, note: '틱톡 앱 알림함에서 확인 후 발행하세요' };
  },
};
