import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Cookie'siz public okuma istemcisi (yalnızca anon key).
 * `cookies()` çağırmadığı için bu istemciyi kullanan sayfalar STATİK/ISR
 * olarak önbelleğe alınabilir ve `unstable_cache` içinde güvenle kullanılır.
 * Yalnızca herkese açık (RLS ile korunan) verileri okumak içindir.
 */
let _publicClient: ReturnType<typeof createServerClient> | null = null;
export function getPublicClient() {
  if (_publicClient) return _publicClient;
  // createClient (supabase-js) ile aynı sorgu API'si; tip uyumu için
  // createServerClient'ın döndürdüğü gevşek tipe hizalıyoruz.
  _publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ) as unknown as ReturnType<typeof createServerClient>;
  return _publicClient;
}

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 */
export function getServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — ignore. Sessions are refreshed in middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // ignore
          }
        },
      },
    },
  );
}

/**
 * Service-role client for privileged inserts/reads (e.g. admin tools).
 * Only call this from Route Handlers or Server Actions, never expose to the client.
 */
export function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    // Fall back to anon — RLS policies still allow public lead inserts.
    return getServerClient();
  }
  // Lazy import so the service-role bundle doesn't ship to the client.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
