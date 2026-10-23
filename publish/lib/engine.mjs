// 발행 엔진 — 한 번 쓴 글과 파일을 채널마다 맞춰서 내보낸다.
import { inspect, hostPublicly, checkAgainst, waitUntilLive } from './media.mjs';
import { fit, weigherFor, tags as mkTags } from './caption.mjs';
import { record, say, ok, bad, warn, dim, info } from './log.mjs';

import telegram from './channels/telegram.mjs';
import threads from './channels/threads.mjs';
import instagram from './channels/instagram.mjs';
import facebook from './channels/facebook.mjs';
import youtube from './channels/youtube.mjs';
import x from './channels/x.mjs';
import linkedin from './channels/linkedin.mjs';
import tiktok from './channels/tiktok.mjs';
import naver from './channels/naver.mjs';
import bluesky from './channels/bluesky.mjs';
import mastodon from './channels/mastodon.mjs';
import discord from './channels/discord.mjs';

// 무료·심사없음 먼저, 승인 필요한 것, 돈 드는 것 순서
export const CHANNELS = [
  telegram, bluesky, discord, mastodon,     // 오늘 바로 · 무료 · 심사 없음
  threads, instagram, facebook, youtube, tiktok, linkedin,  // 무료지만 플랫폼 승인 필요
  x,                                        // 건당 과금
  naver,                                    // 공개 API 없음 → 초안
];
export const byKey = (k) => CHANNELS.find((c) => c.key === k);

/** 지금 쓸 수 있는 채널과, 무엇이 빠졌는지 */
export function status() {
  return CHANNELS.map((c) => {
    const miss = c.ready();
    return { key: c.key, name: c.name, caps: c.caps, note: c.note, free: !!c.free,
             ready: miss.length === 0, missing: miss };
  });
}

/** 채널마다 실제로 어떤 글이 나갈지 미리 만들어 본다(자격 정보 없어도 됨). */
export function preview({ text = '', files = [], link = '', tags = [], to = 'all' }) {
  const media = files.map(inspect);
  const chans = to === 'all' ? CHANNELS
    : (Array.isArray(to) ? to : String(to).split(',')).map((k) => byKey(k.trim())).filter(Boolean);
  return chans.map((ch) => {
    const usable = media.filter((m) => (m.kind === 'image' ? ch.caps.image : ch.caps.video));
    const problems = checkAgainst(ch.caps, media);
    if (ch.caps.needsMedia && !usable.length) problems.push('사진이나 영상이 있어야 합니다');
    const tail = (tags.length ? '\n\n' + mkTags(tags, ch.key === 'x' ? 2 : 5) : '')
               + (link && ch.caps.link ? `\n\n${link}` : '');
    const f = ch.caps.maxText ? fit(text, ch.caps.maxText, tail, weigherFor(ch.key))
                              : { text: text + tail, count: [...(text + tail)].length, fits: true };
    return { key: ch.key, name: ch.name, limit: ch.caps.maxText || 0, count: f.count, fits: f.fits,
             media: usable.map((m) => `${m.name} (${m.kind}, ${m.mb}MB)`), problems, text: f.text,
             manual: !!ch.caps.manual, ready: ch.ready().length === 0 };
  });
}

/**
 * @param {object} p
 *  text   한 번 쓴 본문
 *  files  올릴 사진·영상 경로들
 *  to     채널 키 배열 ('all' 이면 준비된 것 전부)
 *  link   같이 붙일 주소
 *  tags   해시태그 배열
 *  title  유튜브·네이버 제목
 *  dry    실제로 안 보내고 시험만
 */
export async function publish({ text = '', files = [], to = 'all', link = '', tags = [], title = '', dry = false, category, serial, draft = false, blocks = null, 예약 = null }) {
  const media = files.map(inspect);
  // 'all' 은 '준비된 무료 채널 전부'. 돈 드는 곳(X)은 이름을 직접 적어야만 나간다.
  const wanted = to === 'all' || (Array.isArray(to) && to.includes('all'))
    ? CHANNELS.filter((c) => c.ready().length === 0 && !c.paid)
    : (Array.isArray(to) ? to : String(to).split(',')).map((k) => byKey(k.trim())).filter(Boolean);

  if (!wanted.length) {
    say(warn('보낼 채널이 없어요. `node publish/post.mjs --status` 로 무엇이 빠졌는지 보세요.'));
    return [];
  }

  // 공개 주소가 필요한 채널이 하나라도 있으면 파일을 먼저 호스팅한다
  const needsUrl = wanted.some((c) => c.caps.needsPublicUrl) && media.length;
  if (needsUrl) {
    say(dim('  사진·영상을 공개 주소로 올리는 중…'));
    for (const m of media) { if (!m.url) Object.assign(m, hostPublicly(m.path, { dry })); }
    if (!dry) {
      for (const m of media) {
        if (!m.url) continue;
        const 떴나 = await waitUntilLive(m.url);
        if (!떴나) say(warn(`  ${m.url} 가 아직 안 뜹니다 — 그대로 보냅니다`));
      }
    }
  }

  const results = [];
  for (const ch of wanted) {
    const miss = ch.ready();
    const line = `  ${ch.name.padEnd(12)}`;
    if (miss.length) { say(line + warn('건너뜀 — ' + miss.join(', ') + ' 없음')); results.push({ key: ch.key, skipped: miss }); continue; }

    const problems = checkAgainst(ch.caps, media);
    if (ch.caps.needsMedia && !media.length) problems.push('이 채널은 사진이나 영상이 있어야 해요');
    if (problems.length) { say(line + warn('건너뜀 — ' + problems[0])); results.push({ key: ch.key, skipped: problems }); continue; }

    const usable = media.filter((m) => (m.kind === 'image' ? ch.caps.image : ch.caps.video));
    const tail = (tags.length ? '\n\n' + mkTags(tags, ch.key === 'x' ? 2 : 5) : '') + (link && ch.caps.link ? `\n\n${link}` : '');
    const body = ch.caps.maxText ? fit(text, ch.caps.maxText, tail, weigherFor(ch.key)).text : text + tail;

    try {
      const r = await ch.post({ text: body, media: usable, link, dry, title, category, serial, draft, blocks, 예약 });
      const where = r.url || r.draft || r.id || '';
      say(line + (dry ? info('시험 — ' + (r.would || '')) : ok('완료 ') + dim(String(where))));
      record({ channel: ch.key, dry, ok: true, chars: [...body].length, media: usable.length, ...r });
      results.push({ key: ch.key, ok: true, ...r });
    } catch (e) {
      say(line + bad('실패 — ' + e.message));
      record({ channel: ch.key, dry, ok: false, error: e.message });
      results.push({ key: ch.key, ok: false, error: e.message });
    }
  }
  return results;
}
