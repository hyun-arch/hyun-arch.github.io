// Supabase 연결 설정
// anon key는 "공개용(publishable)" 키라 클라이언트에 노출돼도 안전하며,
// 실제 접근 통제는 DB의 Row Level Security(RLS) 정책이 담당한다.
// 아래 두 값이 비어 있으면 앱은 자동으로 localStorage 폴백 모드로 동작한다.
//
// 값 채우는 법: Supabase 대시보드 → Project Settings → API
//   - Project URL      → SUPABASE_URL
//   - Project API keys의 anon(public) → SUPABASE_ANON_KEY

export const SUPABASE_URL = 'https://chptaqszhlpymefbqjfq.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_kHVxKkCweUyHluk3p-Szdg_VUQac3UI';

export const hasSupabase = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
