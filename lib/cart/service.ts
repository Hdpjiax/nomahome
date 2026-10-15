import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { lineTotal, orderTotal } from '@/lib/money';
import { readCartSession } from './session';

/**
 * Servicio de carrito. Toda escritura pasa por aquí con service role:
 * carts y cart_items no tienen policies de escritura para el cliente
 * (migración 0001). El servidor es el único que toca el carrito.
 */

export type CartLine = {
  itemId: string;
  variantId: string;
  qty: number;
  productSlug: string;
  productName: string;
  productSku: string;
  variantSku: string;
  colorName: string;
  colorHex: string;
  material: string;
  unitPriceCents: number;
  compareAtCents: number | null;
  stock: number;
  mediaPath: string | null;
  mediaAlt: string | null;
  lineTotalCents: number;
};

export type CartView = {
  cartId: string;
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  /** Envío estimado con la tarifa del taller (Michoacán). */
  shippingNote: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

async function findCart(admin: AdminClient, sessionId: string | null, userId: string | null) {
  if (!sessionId && !userId) return null;
  let query = admin
    .from('carts')
    .select('id, session_id, user_id, status')
    .eq('status', 'open')
    .limit(1);
  if (sessionId) query = query.eq('session_id', sessionId);
  else if (userId) query = query.eq('user_id', userId);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`carts: ${error.message}`);
  return data;
}

/** Abre (o crea) el carrito de la sesión. Solo desde Server Functions. */
export async function getOrCreateCart(admin: AdminClient) {
  const { ensureCartSession } = await import('./session');
  const sessionId = await ensureCartSession();

  // Usuario con sesión: preferimos su carrito abierto.
  let userId: string | null = null;
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const existing = await findCart(admin, sessionId, userId);
  if (existing) {
    // Si el invitado tenía carrito y ahora hay sesión, lo amarramos al usuario.
    if (userId && !existing.user_id) {
      await admin.from('carts').update({ user_id: userId }).eq('id', existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await admin
    .from('carts')
    .insert({ session_id: sessionId, user_id: userId, status: 'open' })
    .select('id')
    .single();
  if (error) throw new Error(`create cart: ${error.message}`);
  return created.id as string;
}

/** Carrito solo-lectura para render (no crea cookie ni fila). */
export async function readCart(admin: AdminClient): Promise<string | null> {
  const sessionId = await readCartSession();
  if (!sessionId) return null;
  const cart = await findCart(admin, sessionId, null);
  return cart?.id ?? null;
}

export async function getCartCount(): Promise<number> {
  const admin = createAdminClient();
  const cartId = await readCart(admin);
  if (!cartId) return 0;
  const { data, error } = await admin.from('cart_items').select('qty').eq('cart_id', cartId);
  if (error || !data) return 0;
  return data.reduce((n, i) => n + i.qty, 0);
}

const LINE_SELECT = `
  id, variant_id, qty,
  product_variants(
    id, sku, material, price_cents, compare_at_cents, stock, published,
    colors(name, hex),
    products(slug, name, sku),
    product_media(path, alt, sort_order)
  )
`;

type LineRow = {
  id: string;
  variant_id: string;
  qty: number;
  product_variants:
    | {
        id: string;
        sku: string;
        material: string;
        price_cents: number;
        compare_at_cents: number | null;
        stock: number;
        published: boolean;
        colors: { name: string; hex: string } | null;
        products: { slug: string; name: string; sku: string } | null;
        product_media: { path: string; alt: string; sort_order: number }[] | null;
      }
    | null;
};

function mapLine(row: LineRow): CartLine | null {
  const v = row.product_variants;
  if (!v || !v.published || !v.colors || !v.products) return null;
  const media = (v.product_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0];
  return {
    itemId: row.id,
    variantId: row.variant_id,
    qty: row.qty,
    productSlug: v.products.slug,
    productName: v.products.name,
    productSku: v.products.sku,
    variantSku: v.sku,
    colorName: v.colors.name,
    colorHex: v.colors.hex,
    material: v.material,
    unitPriceCents: v.price_cents,
    compareAtCents: v.compare_at_cents,
    stock: v.stock,
    mediaPath: media?.path ?? null,
    mediaAlt: media?.alt ?? null,
    lineTotalCents: lineTotal(v.price_cents, row.qty),
  };
}

export async function getCartView(): Promise<CartView | null> {
  const admin = createAdminClient();
  const cartId = await readCart(admin);
  if (!cartId) return null;

  const { data, error } = await admin
    .from('cart_items')
    .select(LINE_SELECT)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`cart_items: ${error.message}`);

  const lines = (data as LineRow[]).map(mapLine).filter((l): l is CartLine => l !== null);
  const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);

  // Envío estimado con tarifa de taller (Michoacán); se ajusta con la
  // dirección real en el checkout.
  const totals = orderTotal(subtotalCents, undefined, 'Michoacán');

  return {
    cartId,
    lines,
    itemCount,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    shippingNote: 'Envío estimado dentro de Michoacán. Se ajusta con tu dirección en el pago.',
  };
}

/**
 * Agregar al carrito. El servidor valida todo: variante publicada, producto
 * publicado, stock y precio. El cliente manda variante y cantidad, jamás
 * precios (§6 catálogo, §9 dinero).
 */
export async function addToCart(
  variantId: string,
  qty: number
): Promise<{ ok: true; cartCount: number } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: variant, error: vError } = await admin
    .from('product_variants')
    .select(
      `id, stock, published, products!inner(id, published)`
    )
    .eq('id', variantId)
    .maybeSingle();
  if (vError) throw new Error(`variant: ${vError.message}`);
  if (!variant || !variant.published || !variant.products?.published) {
    return { ok: false, error: 'Esa pieza ya no está publicada.' };
  }
  if (variant.stock <= 0) {
    return { ok: false, error: 'Ese color ya no tiene piezas en taller.' };
  }

  const cartId = await getOrCreateCart(admin);
  const safeQty = Math.max(1, Math.min(Math.floor(qty), variant.stock));

  const { data: existing } = await admin
    .from('cart_items')
    .select('id, qty')
    .eq('cart_id', cartId)
    .eq('variant_id', variantId)
    .maybeSingle();

  if (existing) {
    const newQty = Math.min(existing.qty + safeQty, variant.stock);
    const { error } = await admin
      .from('cart_items')
      .update({ qty: newQty })
      .eq('id', existing.id);
    if (error) throw new Error(`update qty: ${error.message}`);
  } else {
    const { error } = await admin
      .from('cart_items')
      .insert({ cart_id: cartId, variant_id: variantId, qty: safeQty });
    if (error) throw new Error(`insert item: ${error.message}`);
  }

  return { ok: true, cartCount: await getCartCount() };
}

/** Cambiar cantidad de una línea (0 la quita). */
export async function setItemQty(
  itemId: string,
  qty: number
): Promise<{ ok: true; cartCount: number } | { ok: false; error: string; cartCount: number }> {
  const admin = createAdminClient();

  const cartId = await readCart(admin);
  if (!cartId) return { ok: false, error: 'No hay carrito en esta sesión.', cartCount: 0 };

  const { data: item, error } = await admin
    .from('cart_items')
    .select('id, qty, cart_id, product_variants(stock)')
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .maybeSingle();
  if (error || !item) {
    return { ok: false, error: 'Esa línea ya no está en el carrito.', cartCount: 0 };
  }

  if (qty <= 0) {
    await admin.from('cart_items').delete().eq('id', itemId);
    return { ok: true, cartCount: await getCartCount() };
  }

  const stock = item.product_variants?.stock ?? 0;
  const safeQty = Math.min(Math.floor(qty), Math.max(stock, 1));
  const { error: uError } = await admin
    .from('cart_items')
    .update({ qty: safeQty })
    .eq('id', itemId);
  if (uError) throw new Error(`update qty: ${uError.message}`);
  return { ok: true, cartCount: await getCartCount() };
}

export async function removeItem(
  itemId: string
): Promise<{ ok: true; cartCount: number } | { ok: false; error: string; cartCount: number }> {
  const admin = createAdminClient();
  const cartId = await readCart(admin);
  if (!cartId) return { ok: false, error: 'No hay carrito en esta sesión.', cartCount: 0 };

  // Verificamos que la línea sea del carrito de ESTA sesión.
  const { error } = await admin
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cartId);
  if (error) throw new Error(`delete item: ${error.message}`);
  return { ok: true, cartCount: await getCartCount() };
}
