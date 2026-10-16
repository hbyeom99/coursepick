import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Supabase 환경변수를 설정한 뒤 개발 서버를 다시 시작해 주세요.');
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Supabase URL을 확인해 주세요.');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
