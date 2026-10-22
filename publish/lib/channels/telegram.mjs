// 텔레그램 — 글·사진·영상 전부 바로 올라간다. 봇 토큰만 있으면 끝(심사 없음).
import fs from 'node:fs';
import { env, missing } from '../env.mjs';

const API = (t, m) => `https://api.telegram.org/bot${t}/${m}`;

export default {
  key: 'telegram',
  name: '텔레그램',
  caps: { text: true, image: true, video: true, link: true, maxText: 4096, maxMedia: 10, maxMediaMB: 50 },
  needs: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'],
  note: '봇 토큰만 있으면 바로 됩니다. 심사 없음.',
  free: true,

  ready() { return missing(this.needs); },

  async post({ text, media = [], dry }) {
    const e = env();
    const token = e.TELEGRAM_BOT_TOKEN, chat = e.TELEGRAM_CHAT_ID;
    if (dry) return { dry: true, would: media.length ? `${media.length}개 파일 + 글` : '글만' };

    if (!media.length) {
      const r = await fetch(API(token, 'sendMessage'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: false }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.description || '보내기 실패');
      return { id: r.result.message_id };
    }

    // 파일이 있으면 첫 장에 글을 붙여 보낸다
    const first = media[0];
    const method = first.kind === 'video' ? 'sendVideo' : 'sendPhoto';
    const field = first.kind === 'video' ? 'video' : 'photo';
    const fd = new FormData();
    fd.append('chat_id', chat);
    fd.append('caption', text.slice(0, 1024));
    fd.append(field, new Blob([fs.readFileSync(first.path)]), first.name);
    const r = await fetch(API(token, method), { method: 'POST', body: fd }).then((x) => x.json());
    if (!r.ok) throw new Error(r.description || '보내기 실패');

    for (const m of media.slice(1)) {
      const f2 = new FormData();
      f2.append('chat_id', chat);
      f2.append(m.kind === 'video' ? 'video' : 'photo', new Blob([fs.readFileSync(m.path)]), m.name);
      await fetch(API(token, m.kind === 'video' ? 'sendVideo' : 'sendPhoto'), { method: 'POST', body: f2 });
    }
    return { id: r.result.message_id };
  },
};
