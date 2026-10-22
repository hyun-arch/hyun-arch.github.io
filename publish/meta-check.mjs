#!/usr/bin/env node
// 메타(스레드·인스타·페이스북) 토큰 점검 — 지금 가진 토큰으로 뭘 할 수 있는지 알려준다.
//
//   node publish/meta-check.mjs <액세스토큰>
//
// 하는 일
//   · 이 토큰이 살아 있는지, 언제 만료되는지
//   · 어떤 권한이 붙어 있는지 (글 올리기 권한이 있는지)
//   · 연결된 페이지와 인스타그램 비즈니스 계정 ID 를 찾아 준다
//   · 60일짜리 긴 토큰으로 바꾸는 법 안내
const token = process.argv[2];
if (!token) { console.log('\n  쓰는 법:  node publish/meta-check.mjs <액세스토큰>\n'); process.exit(1); }

const G = 'https://graph.facebook.com/v21.0';
const get = async (p) => {
  const r = await fetch(`${G}/${p}${p.includes('?') ? '&' : '?'}access_token=${token}`);
  const d = await r.json().catch(() => ({}));
  if (d.error) throw new Error(d.error.message);
  return d;
};

console.log('');
try {
  const me = await get('me?fields=id,name');
  console.log(`  계정      ${me.name} (${me.id})`);
} catch (e) { console.log('  ※ 토큰이 살아 있지 않습니다 —', e.message); process.exit(1); }

try {
  const d = await get(`debug_token?input_token=${token}`);
  const i = d.data || {};
  const exp = i.expires_at ? new Date(i.expires_at * 1000).toLocaleString('ko-KR') : '만료 없음(긴 토큰)';
  console.log(`  만료      ${exp}`);
  console.log(`  권한      ${(i.scopes || []).join(', ') || '없음'}`);
  const need = ['instagram_basic', 'instagram_content_publish', 'pages_manage_posts'];
  const miss = need.filter((s) => !(i.scopes || []).includes(s));
  if (miss.length) console.log(`  ※ 글 올리려면 더 필요: ${miss.join(', ')}`);
} catch (e) { console.log('  권한 확인 실패 —', e.message); }

try {
  const pages = await get('me/accounts?fields=id,name,access_token,instagram_business_account{id,username}');
  if (!pages.data?.length) console.log('  페이지    없음 — 페이스북 페이지를 만들고 인스타 비즈니스 계정을 연결하세요');
  for (const p of pages.data || []) {
    console.log(`\n  ── ${p.name}`);
    console.log(`     FB_PAGE_ID=${p.id}`);
    console.log(`     FB_PAGE_TOKEN=${p.access_token ? p.access_token.slice(0, 12) + '…(이 명령 출력에서 복사)' : '없음'}`);
    if (p.instagram_business_account) {
      console.log(`     IG_USER_ID=${p.instagram_business_account.id}   (@${p.instagram_business_account.username})`);
    } else {
      console.log('     인스타그램 비즈니스 계정이 이 페이지에 연결돼 있지 않습니다');
    }
  }
} catch (e) { console.log('  페이지 조회 실패 —', e.message); }

console.log('\n  긴 토큰(60일)으로 바꾸려면:');
console.log('  https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<앱ID>&client_secret=<앱시크릿>&fb_exchange_token=<지금토큰>\n');
