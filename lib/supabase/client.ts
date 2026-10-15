import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Cliente Supabase del navegador (anon key, RLS aplica).
 * Usa @supabase/ssr para que la sesión viva en COOKIES: el servidor la ve
 * en cada request; localStorage no sirve para SSR y jamás guarda roles.
 * Para el servidor usa lib/supabase/server.ts; para service role,
 * lib/supabase/admin.ts.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createSSRBrowserClient<Database>(url, anonKey);
}
