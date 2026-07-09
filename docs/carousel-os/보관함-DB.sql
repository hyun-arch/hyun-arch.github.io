-- 캐러셀 보관함 — Supabase 스키마 + RLS
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행.

create table if not exists public.carousels (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) default auth.uid(),
  week_number   int,
  topic         text,
  prompt        text,
  character_ids text[],
  model         text,
  slides        jsonb,
  image_urls    text[],
  created_at    timestamptz not null default now()
);

-- 내 것만 보이게: Row Level Security
alter table public.carousels enable row level security;

create policy "본인 것만 조회" on public.carousels
  for select using (auth.uid() = user_id);
create policy "본인 것만 추가" on public.carousels
  for insert with check (auth.uid() = user_id);
create policy "본인 것만 수정" on public.carousels
  for update using (auth.uid() = user_id);
create policy "본인 것만 삭제" on public.carousels
  for delete using (auth.uid() = user_id);

-- Storage 버킷(PNG): 대시보드 Storage 에서 'carousels' 버킷 생성 후,
-- 정책으로 auth.uid() 폴더 하위만 read/write 허용.
