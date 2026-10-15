import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Sesión en servidor (§6 admin): getUser() valida contra el servidor de
 * auth; jamás confiamos en un rol guardado en localStorage.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export type Profile = {
  id: string;
  fullName: string;
  phone: string | null;
  role: 'customer' | 'admin';
};

export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    role: data.role as 'customer' | 'admin',
  };
}
