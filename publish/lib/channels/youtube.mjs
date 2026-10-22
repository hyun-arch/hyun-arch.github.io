// 유튜브 — 영상·쇼츠. 설치형 OAuth(리프레시 토큰)로 올린다.
// 세로 영상에 #Shorts 를 붙이면 쇼츠로 잡힌다.
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

export default {
  key: 'youtube',
  name: '유튜브',
  caps: { text: false, image: false, video: true, link: false, maxText: 5000, maxMedia: 1, needsMedia: true },
  needs: ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN'],
  note: '영상만 올라갑니다. 구글 클라우드에서 YouTube Data API 를 켜고 리프레시 토큰을 받아두세요.',

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry, title }) {
    const vids = media.filter((m) => m.kind === 'video');
    if (!vids.length) throw new Error('유튜브는 영상 파일이 필요합니다');
    const v = vids[0];
    if (dry) return { dry: true, would: `${v.name} (${v.mb}MB) 업로드` };

    const e = env();
    const tok = await accessToken(e);
    const meta = {
      snippet: {
        title: (title || firstLine(text) || '제목 없음').slice(0, 100),
        description: text.slice(0, 5000),
        categoryId: '22',
      },
      status: { privacyStatus: e.YT_PRIVACY || 'public', selfDeclaredMadeForKids: false },
    };

    // 1) 업로드 세션 열기
    const init = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      { method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json',
                   'X-Upload-Content-Type': 'video/*', 'X-Upload-Content-Length': String(v.bytes) },
        body: JSON.stringify(meta) });
    if (!init.ok) throw new Error('업로드 세션 실패: ' + (await init.text()).slice(0, 200));
    const target = init.headers.get('location');

    // 2) 본체 올리기
    const put = await fetch(target, {
      method: 'PUT',
      headers: { 'Content-Type': 'video/*', 'Content-Length': String(v.bytes) },
      body: fs.readFileSync(v.path),
    });
    const d = await put.json().catch(() => ({}));
    if (!put.ok) throw new Error('업로드 실패: ' + JSON.stringify(d).slice(0, 200));
    return { id: d.id, url: `https://youtu.be/${d.id}` };
  },
};

const firstLine = (s) => (s || '').split('\n').find((l) => l.trim());

async function accessToken(e) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: e.YT_CLIENT_ID, client_secret: e.YT_CLIENT_SECRET,
      refresh_token: e.YT_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('구글 토큰 갱신 실패: ' + JSON.stringify(d).slice(0, 160));
  return d.access_token;
}
