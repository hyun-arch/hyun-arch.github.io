# 보관함 — Supabase DB 설계 (Carousel OS v2)

> "DB 없으면 다 날아간다." 만든 캐러셀·캐릭터 결과물을 영구 보관하기 위한 구조.
> 슬라이드 설계 그대로: **Storage(PNG) + Database(메타데이터) + Auth(내 것만)**.
> 지금은 localStorage로 작동하고, 아래 키를 넣으면 클라우드로 자동 승격.

## 3층 구조
| 층 | 역할 | 담는 것 |
|---|---|---|
| **Storage** | 파일 저장소 | 슬라이드 PNG (`/{user}/{carousel}/slide-1.png` …) |
| **Database** | 메타데이터 | 언제·뭐·누가 (아래 테이블) |
| **Auth** | 사용자 인증 | `user_id` 자동 발급, RLS로 "내 보관함만" |

## 테이블: `carousels`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | 자동 |
| user_id | uuid | auth.uid() — 소유자 |
| week_number | int | 주차 |
| topic | text | 주제 (예: 클로드코드 치트키) |
| prompt | text | 생성에 쓴 지시(STIC) |
| character_ids | text[] | 사용한 캐릭터들 |
| model | text | 이미지 생성 모델 |
| slides | jsonb | 슬라이드 데이터(제목·본문 등) |
| image_urls | text[] | Storage PNG 링크들 |
| created_at | timestamptz | 기본 now() |

## SQL — Supabase SQL Editor에 붙여넣기
`docs/carousel-os/보관함-DB.sql` 참고.

## 붙이는 순서 (키는 절대 노출 안 함 — [[api-key-security]])
1. supabase.com에서 프로젝트 생성 (무료: DB 500MB + Storage 1GB + Auth 50K)
2. SQL Editor에 `보관함-DB.sql` 실행 → 테이블 + RLS 생성
3. Project Settings → API 에서 **Project URL**, **anon key** 복사
4. 로컬 `.env` (또는 `src/lib/config.js`)에 넣기 — `.gitignore` 확인
5. 새로고침하면 자동으로 클라우드 모드 (config.js `hasSupabase()` true)

지금은 4번 전까지 **브라우저 저장**으로 작동 → 같은 브라우저에선 안 날아감. 클라우드로 올리면 기기 바뀌어도 유지.
