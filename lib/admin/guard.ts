import 'server-only';
import { notFound } from 'next/navigation';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import type { User } from '@supabase/supabase-js';

/**
 * Guard del panel (§6 admin skill): el layout admin exige sesión y
 * profiles.role = admin verificados EN SERVIDOR. Un layout cliente no
 * basta, y el rol jamás viene solo del localStorage.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) notFound();
  const profile = await getProfile();
  if (profile?.role !== 'admin') notFound();
  return user;
}

/** Verificación para Server Actions del panel: lanza si no es admin. */
export async function assertAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error('Se necesita sesión de admin.');
  const profile = await getProfile();
  if (profile?.role !== 'admin') throw new Error('Se necesita rol de admin.');
  return user;
}
