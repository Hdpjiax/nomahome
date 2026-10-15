import 'server-only';
import { cookies } from 'next/headers';

/**
 * Acceso del comprador invitado a su pedido (§8 pedido): el token secreto
 * del pedido vive en cookie httpOnly. Ver /pedido/[id] lo cruza contra
 * orders.guest_token en la base.
 */
const COOKIE_NAME = 'cl_orders';

type Entry = { orderId: string; token: string };

function parse(value: string | undefined): Entry[] {
  if (!value) return [];
  return value
    .split(' ')
    .map((chunk) => chunk.split('.'))
    .filter((parts) => parts.length === 2)
    .map(([orderId, token]) => ({ orderId, token }));
}

export async function getGuestOrderTokens(): Promise<Map<string, string>> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return new Map(parse(value).map((e) => [e.orderId, e.token]));
}

/** Registra el pedido recién creado para el invitado. Solo Server Functions. */
export async function rememberGuestOrder(orderId: string, token: string): Promise<void> {
  const store = await cookies();
  const existing = parse(store.get(COOKIE_NAME)?.value).filter(
    (e) => e.orderId !== orderId
  );
  existing.push({ orderId, token });
  store.set(COOKIE_NAME, existing.map((e) => `${e.orderId}.${e.token}`).join(' '), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
