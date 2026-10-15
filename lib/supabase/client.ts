import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Cliente Supabase del navegador (anon key, RLS aplica).
 * Para el servidor usa lib/supabase/server.ts; para service role,
 * lib/supabase/admin.ts.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createClient<Database>(url, anonKey);
}
