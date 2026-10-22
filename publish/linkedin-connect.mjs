#!/usr/bin/env node
// 링크드인 연결 — 개인 프로필 게시는 무료이고 승인 대기도 없다(자가등록).
//
//   node publish/linkedin-connect.mjs <클라이언트ID> <클라이언트시크릿>
//
// 링크드인에서 할 일(한 번만, 무료)
//   1) developer.linkedin.com → Create app (회사 페이지 하나 연결해야 함)
//   2) Products 탭 → 'Share on LinkedIn' 추가  ← 심사 없이 바로 붙는다
//   3) Products 탭 → 'Sign In with LinkedIn using OpenID Connect' 추가
//   4) Auth 탭 → Redirect URLs 에  http://localhost:8732  추가
//   → 나오는 Client ID / Secret 을 이 명령에 붙이면 끝.
import http from 'node:http';
import { exec } from 'node:child_process';

const [id, secret] = process.argv.slice(2);
if (!id || !secret) { console.log('\n  쓰는 법:  node publish/linkedin-connect.mjs <클라이언트ID> <시크릿>\n'); process.exit(1); }

const PORT = 8732, REDIRECT = `http://localhost:${PORT}`;
const auth = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
  response_type: 'code', client_id: id, redirect_uri: REDIRECT,
  scope: 'openid profile w_member_social', state: 'aramirror',
});

console.log('\n  브라우저에서 링크드인 로그인 → 허용을 눌러 주세요.');
console.log('  창이 안 뜨면 직접 여세요:\n  ' + auth + '\n');
exec(`open "${auth}"`);

const code = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const c = new URL(req.url, REDIRECT).searchParams.get('code');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2 style="font-family:system-ui">연결됐습니다. 터미널로 돌아가세요.</h2>');
    if (c) { s.close(); resolve(c); }
  });
  s.listen(PORT);
});

const tok = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: id, client_secret: secret }),
}).then((r) => r.json());

if (!tok.access_token) { console.log('\n  토큰 실패:', JSON.stringify(tok).slice(0, 300), '\n'); process.exit(1); }

const me = await fetch('https://api.linkedin.com/v2/userinfo', {
  headers: { Authorization: `Bearer ${tok.access_token}` },
}).then((r) => r.json());

console.log('\n  연결됨:', me.name || me.sub);
console.log('\n  ── publish/.env 에 아래 두 줄을 붙여넣으세요 ──\n');
console.log(`  LI_ACCESS_TOKEN=${tok.access_token}`);
console.log(`  LI_PERSON_URN=urn:li:person:${me.sub}`);
console.log(`\n  (토큰은 ${Math.round((tok.expires_in || 0) / 86400)}일 뒤 만료됩니다)\n`);
