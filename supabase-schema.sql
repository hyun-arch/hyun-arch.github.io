-- Aramirror 게시판 — Supabase 스키마
-- 실행 위치: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 Run
-- (한 번만 실행하면 됩니다. 시드 3건까지 함께 들어갑니다.)

-- 1) 게시판 글 테이블
create table if not exists public.posts (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  category   text        not null default '생각',
  tags       jsonb       not null default '[]'::jsonb,
  body       text        not null default '',
  status     text        not null default 'published',   -- published | draft
  date       date        not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Row Level Security 활성화
alter table public.posts enable row level security;

-- 3) 정책 — v1: 공개 읽기 + 공개 쓰기(anon)
--    ※ 지금은 누구나 읽고 쓸 수 있는 개인 프로젝트용 설정입니다.
--      쓰기까지 잠그려면 Supabase Auth(로그인)로 승격하세요(주석 하단 참고).
drop policy if exists "posts public read"   on public.posts;
drop policy if exists "posts public insert" on public.posts;
drop policy if exists "posts public update" on public.posts;
drop policy if exists "posts public delete" on public.posts;

create policy "posts public read"   on public.posts for select using (true);
create policy "posts public insert" on public.posts for insert with check (true);
create policy "posts public update" on public.posts for update using (true) with check (true);
create policy "posts public delete" on public.posts for delete using (true);

-- 4) 시드 3건 (이미 있으면 건너뜀)
insert into public.posts (title, category, tags, body, status, date)
select * from (values
  ('Genesis — 텔레그램 한 줄에서 시작된 OS', '빌드로그',
   '["Aramirror","OS","Telegram"]'::jsonb,
   '메모앱이 아니라 "내 생각이 값(자산)이 되는 환경"을 만들었다. 텔레그램으로 던지면 저널에 누적되고, 밤마다 위키로 승격되고, 아라미러로 발행된다.',
   'published', date '2026-06-29'),
  ('Flow — 몰입, 그리고 알을 깨는 새', '빌드로그',
   '["Flow","몰입"]'::jsonb,
   '시간을 한 방울씩. 몰입 타이머와 몰입 기록으로 집중의 리듬을 자산으로 남긴다.',
   'published', date '2026-07-03'),
  ('0704 에이든의 이기적스폰지 공유회 — 초중급 정리', '공유회',
   '["ClaudeCode","스킬","서브에이전트","CRUD","KEY연결"]'::jsonb,
   '재활용이 자동화의 핵심 = 스킬. 스킬과 서브에이전트는 본질적으로 같다. .env 하나에서 GitHub·Supabase·Vercel로 배선 — 한 번이 힘들지 그다음은 쭉 편해진다. 실습 산출물: 어드민 게시판(BASEBOARD).',
   'published', date '2026-07-04')
) as v(title, category, tags, body, status, date)
where not exists (select 1 from public.posts);

-- ────────────────────────────────────────────────────────────
-- 5) 캐러셀 보관함 테이블 (스튜디오 07 보관함 → 클라우드 승격)
--    Storage = 슬라이드 PNG 링크(image_urls) / Database = 아래 메타데이터
create table if not exists public.carousels (
  id            uuid        primary key default gen_random_uuid(),
  topic         text        not null,
  week_number   int,
  slides        int         not null default 0,
  prompt        text        not null default '',
  character_ids jsonb       not null default '[]'::jsonb,
  model         text        not null default '',
  image_urls    jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

alter table public.carousels enable row level security;

drop policy if exists "carousels public read"   on public.carousels;
drop policy if exists "carousels public insert" on public.carousels;
drop policy if exists "carousels public delete" on public.carousels;

create policy "carousels public read"   on public.carousels for select using (true);
create policy "carousels public insert" on public.carousels for insert with check (true);
create policy "carousels public delete" on public.carousels for delete using (true);

-- ────────────────────────────────────────────────────────────
-- 6) 활동 로그 테이블 (events) — "지하 엔진실"
--    페이지 열람·몰입 세션·시계 사용 등 모든 활동이 시간순으로 쌓인다.
--    밤마다 종합하고 아침 5시 보고에 반영하는 데이터 원천.
create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  type        text        not null,                       -- page_view | flow_session | clock_open ...
  payload     jsonb       not null default '{}'::jsonb,    -- 활동별 부가정보
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists events_occurred_idx on public.events (occurred_at desc);
create index if not exists events_type_idx      on public.events (type);

alter table public.events enable row level security;

drop policy if exists "events public read"   on public.events;
drop policy if exists "events public insert" on public.events;

create policy "events public read"   on public.events for select using (true);
create policy "events public insert" on public.events for insert with check (true);

-- ────────────────────────────────────────────────────────────
-- (선택) 쓰기 보호까지 원하면: 위 insert/update/delete 정책을 지우고
--   create policy "posts auth write" on public.posts
--     for all to authenticated using (true) with check (true);
-- 로 바꾼 뒤, 클라이언트에 Supabase Auth 로그인을 붙이면 됩니다.
