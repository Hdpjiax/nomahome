import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'cl_session';
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Sesión de carrito para invitados: cookie httpOnly con un id opaco.
 * Solo se crea desde Server Actions / Route Handlers (donde cookies().set
 * es válido); en render de páginas y layouts solo se lee.
 */
export async function readCartSession(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value ?? null;
  if (!value) return null;
  return /^[0-9a-f-]{32,64}$/i.test(value) ? value : null;
}

/** Lee la sesión y, si no existe, la crea. Solo en Server Actions / Routes. */
export async function ensureCartSession(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing && /^[0-9a-f-]{32,64}$/i.test(existing)) return existing;

  const id = crypto.randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR,
  });
  return id;
}
