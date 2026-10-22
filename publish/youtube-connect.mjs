#!/usr/bin/env node
// 유튜브 연결 — 리프레시 토큰 받아오기.
//
//   node publish/youtube-connect.mjs <클라이언트ID> <클라이언트보안비밀>
//
// 구글 클라우드에서 할 일(한 번만, 무료):
//   1) console.cloud.google.com → 프로젝트 만들기
//   2) 'YouTube Data API v3' 사용 설정
//   3) OAuth 동의 화면 → 외부 → 테스트 사용자에 내 계정 추가
//   4) 사용자 인증 정보 → OAuth 클라이언트 ID → '데스크톱 앱'
//   → 나오는 ID 와 보안비밀을 이 명령에 붙이면 끝.
//
// 받은 토큰은 화면에 찍어 드립니다. publish/.env 에 직접 붙여넣으세요(제가 저장하지 않습니다).
import http from 'node:http';
import { exec } from 'node:child_process';

const [id, secret] = process.argv.slice(2);
if (!id || !secret) {
  console.log('\n  쓰는 법:  node publish/youtube-connect.mjs <클라이언트ID> <클라이언트보안비밀>\n');
  process.exit(1);
}

const PORT = 8731;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

const auth = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: id, redirect_uri: REDIRECT, response_type: 'code',
  scope: SCOPE, access_type: 'offline', prompt: 'consent',
});

console.log('\n  브라우저에서 구글 로그인 → 허용을 눌러 주세요.');
console.log('  창이 안 뜨면 이 주소를 직접 여세요:\n  ' + auth + '\n');
exec(`open "${auth}"`);

const code = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const u = new URL(req.url, REDIRECT);
    const c = u.searchParams.get('code');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2 style="font-family:system-ui">연결됐습니다. 터미널로 돌아가세요.</h2>');
    if (c) { s.close(); resolve(c); }
  });
  s.listen(PORT);
});

const r = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
});
const d = await r.json();
if (!d.refresh_token) {
  console.log('\n  토큰을 못 받았습니다:', JSON.stringify(d).slice(0, 300), '\n');
  process.exit(1);
}

console.log('\n  ── publish/.env 에 아래 세 줄을 붙여넣으세요 ──\n');
console.log(`  YT_CLIENT_ID=${id}`);
console.log(`  YT_CLIENT_SECRET=${secret}`);
console.log(`  YT_REFRESH_TOKEN=${d.refresh_token}`);
console.log('\n  그러면 영상 자동 업로드가 됩니다:  node publish/post.mjs --media 영상.mp4 --to youtube\n');
