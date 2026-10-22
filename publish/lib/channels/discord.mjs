// 디스코드 — 웹훅 주소 하나면 끝. 무료, 심사 없음, 파일도 그대로 올라간다.
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

export default {
  key: 'discord',
  name: '디스코드',
  caps: { text: true, image: true, video: true, link: true, maxText: 2000, maxMedia: 10, maxMediaMB: 8 },
  needs: ['DISCORD_WEBHOOK_URL'],
  note: '채널 설정 → 연동 → 웹훅에서 주소 복사하면 끝.',
  free: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    if (dry) return { dry: true, would: media.length ? `${media.length}개 첨부 + 글` : '글만' };
    const fd = new FormData();
    fd.append('payload_json', JSON.stringify({ content: text.slice(0, 2000) }));
    media.slice(0, 10).forEach((m, i) => fd.append(`files[${i}]`, new Blob([fs.readFileSync(m.path)]), m.name));
    const r = await fetch(e.DISCORD_WEBHOOK_URL + '?wait=true', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120));
    const d = await r.json().catch(() => ({}));
    return { id: d.id };
  },
};
