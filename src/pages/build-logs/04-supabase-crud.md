---
layout: ../../layouts/Base.astro
title: "#04 게시판을 실서버로 — localStorage에서 Supabase로 승격하다"
description: "#03에서 열어둔 승격의 문을 실제로 통과한 기록. 스토어 인터페이스는 그대로 두고 저장소만 갈아끼워, 정적 사이트 위 게시판을 다중 사용자 서버 CRUD로 올렸다."
date: "2026-07-07"
---

# #04 게시판을 실서버로

<p class="meta">2026-07-07 · Build Log</p>

> 한 번 연결이 힘들지, 그다음은 쭉 편해진다. #03에서 문만 열어뒀던 그 연결을, 오늘 실제로 통과했다.

## #03이 남긴 숙제

지난 기록에서 게시판을 브라우저 스토어(localStorage)로 먼저 세우고 이렇게 적었다.

> "스토어 인터페이스(`getPosts / createPost / updatePost / deletePost`)는 이미 그 승격을 염두에 두고 잘라두었다."

경계를 미리 그어두면, 나중에 저장소만 갈아끼우면 된다 — 그 약속을 지킬 차례였다.

## 무엇을 바꿨나

UI는 한 줄도 손대지 않았다. 데이터 레이어 뒤편만 갈아끼웠다.

- **저장소 승격** — `localStorage` → **Supabase(Postgres)**. 이제 한 사람의 브라우저가 아니라, 어디서 접속하든 같은 글이 보인다.
- **이중 모드(dual mode)** — Supabase 키가 있으면 서버로, 없으면 예전처럼 로컬 스토어로 자동 폴백. 키가 빠져도 사이트가 죽지 않는다.
- **인터페이스는 그대로** — `getPosts / createPost / updatePost / deletePost` 시그니처를 유지했다. #03에서 잘라둔 경계 덕분에, 관리자 콘솔과 게시판 페이지는 자기 뒤편이 바뀐 걸 모른다.

이게 #03에서 "저장소만 갈아끼우면 된다"고 한 말의 실물이다. 재활용의 값을 오늘 정확히 받아냈다.

## 왜 이중 모드인가

정적 사이트(GitHub Pages)는 서버가 없다. 그래서 키를 코드에 박지 않고 설정값으로 주입하고, 없으면 로컬로 떨어지게 했다. 덕분에

- 키를 아직 안 넣은 상태에서도 사이트는 정상 동작하고,
- 키를 넣는 순간 같은 콘솔이 그대로 **다중 사용자 실서버 CRUD**가 된다.

배포와 실서버 사이의 문턱을 없앤 셈이다.

## 남은 메모

- 스키마(`supabase-schema.sql`)는 열려 있다. Supabase 프로젝트 URL·anon key만 설정에 채우면 승격이 즉시 완료된다.
- 원천은 여전히 마크다운. 렌더링에 기대지 않는 구조를 계속 지킨다.

> 경계를 잘 그어두면, 성장은 갈아끼우기가 된다. 다시 짓는 게 아니라.

---

## English

# #04 The Board Goes Server-Side

> The first connection is the hard one; everything after is easy. In #03 I only left the door open — today I actually walked through it.

### The homework #03 left

Last time I stood the board up on browser storage (localStorage) and wrote:

> "The store interface (`getPosts / createPost / updatePost / deletePost`) was already cut with this promotion in mind."

Draw the boundary early, and later you only have to swap the storage. It was time to keep that promise.

### What changed

I didn't touch a single line of UI. I only swapped what sits behind the data layer.

- **Storage promotion** — `localStorage` → **Supabase (Postgres)**. Now it isn't one person's browser; the same posts show up wherever you connect from.
- **Dual mode** — with Supabase keys it runs server-side; without them it falls back to the old local store automatically. Miss the keys and the site still doesn't die.
- **Same interface** — the `getPosts / createPost / updatePost / deletePost` signatures held. Thanks to the boundary cut in #03, the admin console and board pages have no idea their backend moved.

This is the physical proof of "just swap the storage" from #03. Today the value of reuse paid out exactly.

### Why dual mode

A static site (GitHub Pages) has no server. So I inject the keys as config instead of hard-coding them, and fall back to local when they're absent. Because of that:

- the site works fine even before any keys are set, and
- the moment keys go in, the very same console becomes **multi-user, real-server CRUD**.

The threshold between "deployed" and "real server" is gone.

### Notes left

- The schema (`supabase-schema.sql`) is open. Fill the Supabase project URL and anon key into config, and the promotion completes instantly.
- The source is still Markdown. I keep the structure from leaning on rendering.

> Draw the boundary well, and growth becomes a swap — not a rebuild.
