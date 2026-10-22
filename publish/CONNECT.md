# SNS 채널 연결하기 — 한 번만 하면 `--to all` 로 동시 발행

```bash
node publish/post.mjs --status                      # 지금 상태
node publish/post.mjs --text "한 줄" --to all       # 연결된 곳 전부에
node publish/post.mjs --text "…" --media 사진.jpg --to threads,instagram
```

## 지금 연결된 것 (2026-10-22)

| 채널 | 상태 |
|---|---|
| 스레드 | ● 바로 올라감 |
| 인스타그램 | ● 바로 올라감 |
| 네이버 블로그 | ● 바로 올라감 |

## 쉬운 것부터 — 무료·심사 없음

### ① 텔레그램 (5분) — 가장 쉽다
1. 텔레그램에서 **@BotFather** 에게 `/newbot` → 이름 정하면 **토큰**이 나온다
2. 만든 봇에게 아무 말이나 보낸다
3. `https://api.telegram.org/bot<토큰>/getUpdates` 를 열면 `chat.id` 가 보인다
```
publish/.env 에
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### ② 디스코드 (3분) — 더 쉽다
서버 → 채널 설정 → 연동 → **웹후크 만들기** → 주소 복사
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### ③ 블루스카이 (3분)
설정 → 앱 비밀번호 → 새로 만들기
```
BSKY_HANDLE=...bsky.social
BSKY_APP_PASSWORD=...
```

### ④ 마스토돈 (3분)
설정 → 개발 → 새 앱 → `write:statuses` 권한
```
MASTODON_HOST=mastodon.social
MASTODON_ACCESS_TOKEN=...
```

## 링크드인 (10분) — 무료지만 앱 등록이 필요하다

개인 프로필 게시는 **무료이고 심사도 없다.** 다만 앱을 하나 만들어야 한다.

1. `developer.linkedin.com` → **Create app** (회사 페이지 하나를 연결해야 함)
2. **Products** 탭 → `Share on LinkedIn` 추가 ← 심사 없이 바로 붙는다
3. **Products** 탭 → `Sign In with LinkedIn using OpenID Connect` 추가
4. **Auth** 탭 → Redirect URLs 에 `http://localhost:8732` 추가
5. 나온 Client ID / Secret 으로:
```bash
node publish/linkedin-connect.mjs <클라이언트ID> <시크릿>
```
브라우저가 열리고 허용을 누르면 토큰이 `.env` 에 저장된다.

## 심사·유료라 나중에

| 채널 | 왜 |
|---|---|
| 페이스북 페이지 | 앱 심사 필요 |
| 유튜브 | OAuth 설정 + 할당량 |
| 틱톡 | 개발자 승인 |
| X | **2026년부터 건당 과금** — 글 1건 약 20원, 링크 포함 약 280원 |

---
연결 뒤에는 `node publish/post.mjs --status` 로 ● 가 되었는지 확인한다.
