'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { getCartView, readCart } from '@/lib/cart/service';
import { lineTotal, orderTotal, shippingCents } from '@/lib/money';
import { addressSchema, checkoutEmailSchema } from '@/lib/validators';
import { newPublicRef, newGuestToken } from '@/lib/payments/reference';
import { rememberGuestOrder } from './guest-access';
import { simulateApprovedPayment, confirmSpeiPaymentAsAdmin } from '@/lib/payments/webhook';
import { isSandbox } from '@/lib/payments/signature';

export type CheckoutState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

/**
 * Creación del pedido (§8 checkout, §9 dinero):
 *   1. El servidor recalcula TODO: precios vivos de la base, stock clamp,
 *      envío según estado y totales con IVA incluido.
 *   2. El pedido nace pending_payment con snapshot de dirección y de
 *      precios. Jamás llega 'paid' desde el cliente.
 *   3. El renglón SPEI del ledger nace 'pending' con la referencia.
 */
export async function createOrderAction(
  _prev: CheckoutState | null,
  formData: FormData
): Promise<CheckoutState> {
  const user = await getSessionUser();
  const admin = createAdminClient();

  // ---- Datos del comprador -------------------------------------------
  let email: string;
  let name: string;
  if (user) {
    const profile = await getProfile();
    email = user.email ?? '';
    name = profile?.fullName ?? '';
    if (!email) return { status: 'error', message: 'Tu cuenta no tiene correo.' };
  } else {
    const parsedEmail = checkoutEmailSchema.safeParse(formData.get('email'));
    if (!parsedEmail.success) {
      return { status: 'error', message: 'Revisa tus datos.', fieldErrors: { email: parsedEmail.error.issues[0].message } };
    }
    email = parsedEmail.data;
    name = String(formData.get('name') ?? '').trim();
    if (name.length < 2) {
      return { status: 'error', message: 'Revisa tus datos.', fieldErrors: { name: 'Escribe tu nombre.' } };
    }
  }

  // ---- Dirección: guardada o nueva ------------------------------------
  const addressId = formData.get('addressId');
  let snapshot: {
    recipient: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    phone: string;
  };

  if (addressId && user) {
    const supabase = await createSupabaseServerClient();
    const { data: address } = await supabase
      .from('addresses')
      .select('recipient, line1, line2, city, state, postal_code, phone')
      .eq('id', String(addressId))
      .eq('user_id', user.id) // RLS también lo exige
      .maybeSingle();
    if (!address) {
      return { status: 'error', message: 'Esa dirección no existe en tu cuenta.' };
    }
    snapshot = address;
  } else {
    const parsed = addressSchema.safeParse({
      recipient: String(formData.get('recipient') ?? ''),
      line1: String(formData.get('line1') ?? ''),
      line2: String(formData.get('line2') ?? ''),
      city: String(formData.get('city') ?? ''),
      state: String(formData.get('state') ?? ''),
      postalCode: String(formData.get('postalCode') ?? ''),
      phone: String(formData.get('phone') ?? ''),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { status: 'error', message: 'Revisa la dirección de envío.', fieldErrors };
    }
    snapshot = {
      recipient: parsed.data.recipient,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      postal_code: parsed.data.postalCode,
      phone: parsed.data.phone,
    };

    // Guardar en direcciones si pidió (solo con sesión)
    if (user && formData.get('saveAddress') === 'on') {
      const supabase = await createSupabaseServerClient();
      await supabase.from('addresses').insert({
        user_id: user.id,
        ...snapshot,
      });
    }
  }

  // ---- Carrito y recálculo con precios vivos --------------------------
  const cart = await getCartView();
  if (!cart || cart.lines.length === 0) {
    return { status: 'error', message: 'Tu carrito está vacío.' };
  }

  const { data: variants, error: vError } = await admin
    .from('product_variants')
    .select('id, sku, price_cents, stock, published, products!inner(name, slug, published)')
    .in(
      'id',
      cart.lines.map((l) => l.variantId)
    );
  if (vError) throw new Error(`variants: ${vError.message}`);

  type LiveVariant = (typeof variants)[number] & { id: string };
  const liveById = new Map((variants as LiveVariant[]).map((v) => [v.id, v]));

  const items: {
    variant_id: string;
    name_snapshot: string;
    sku_snapshot: string;
    unit_price_cents: number;
    qty: number;
  }[] = [];

  for (const line of cart.lines) {
    const live = liveById.get(line.variantId);
    if (!live || !live.published || !live.products.published) {
      return {
        status: 'error',
        message: `${line.productName} salió del catálogo. Qútala del carrito y sigue.`,
      };
    }
    const qty = Math.min(line.qty, live.stock);
    if (qty <= 0) {
      return {
        status: 'error',
        message: `${line.productName} ya no tiene piezas en taller. Qútala del carrito y sigue.`,
      };
    }
    items.push({
      variant_id: live.id,
      name_snapshot: live.products.name,
      sku_snapshot: live.sku,
      unit_price_cents: live.price_cents,
      qty,
    });
  }

  const subtotalCents = items.reduce((n, i) => n + lineTotal(i.unit_price_cents, i.qty), 0);
  const shipping = shippingCents(subtotalCents, snapshot.state);
  const totals = orderTotal(subtotalCents, shipping);

  // ---- Insert: pedido + snapshot + renglón SPEI del ledger ------------
  const cartId = await readCart(admin);
  if (!cartId) return { status: 'error', message: 'Tu carrito está vacío.' };

  const publicRef = newPublicRef();
  const guestToken = user ? null : newGuestToken();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user?.id ?? null,
      email,
      status: 'pending_payment',
      subtotal_cents: totals.subtotalCents,
      shipping_cents: totals.shippingCents,
      tax_cents: totals.taxCents,
      total_cents: totals.totalCents,
      address_snapshot: { ...snapshot, name },
      public_ref: publicRef,
      guest_token: guestToken,
    })
    .select('id')
    .single();
  if (orderError) throw new Error(`orders insert: ${orderError.message}`);

  const { error: itemsError } = await admin
    .from('order_items')
    .insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) throw new Error(`order_items: ${itemsError.message}`);

  const { error: payError } = await admin.from('payments').insert({
    order_id: order.id,
    provider: 'spei',
    status: 'pending',
    method: 'transferencia spei',
    reference: publicRef,
    amount_cents: totals.totalCents,
    fee_cents: 0,
    net_cents: totals.totalCents,
    raw_status: 'awaiting_transfer',
  });
  if (payError) throw new Error(`payments: ${payError.message}`);

  // Cerrar el carrito: la próxima compra abre carrito nuevo.
  await admin.from('carts').update({ status: 'ordered' }).eq('id', cartId);

  // Invitado: token httpOnly para ver su pedido después.
  if (!user && guestToken) {
    await rememberGuestOrder(order.id, guestToken);
  }

  await admin.from('audit_logs').insert({
    actor_id: user?.id ?? null,
    action: 'order.created',
    entity: 'orders',
    entity_id: order.id,
  });

  revalidatePath('/carrito');
  revalidatePath('/checkout');
  redirect(`/pedido/${order.id}`);
}

/** Simular pago aprobado — SOLO sandbox, pasa por la firma del webhook. */
export async function simulatePaymentAction(orderId: string): Promise<{ message: string }> {
  if (!isSandbox()) {
    return { message: 'La simulación solo existe en sandbox.' };
  }
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('public_ref')
    .eq('id', orderId)
    .maybeSingle();
  if (!order?.public_ref) return { message: 'Pedido sin referencia.' };

  const result = await simulateApprovedPayment(order.public_ref);
  revalidatePath(`/pedido/${orderId}`);
  return { message: result.message };
}

/** Confirmación del taller — solo admin, verificada en servidor. */
export async function confirmSpeiPaymentAction(orderId: string): Promise<{ message: string }> {
  const user = await getSessionUser();
  if (!user) return { message: 'Solo el taller puede confirmar pagos.' };
  const profile = await getProfile();
  if (profile?.role !== 'admin') {
    return { message: 'Solo el taller puede confirmar pagos.' };
  }
  const result = await confirmSpeiPaymentAsAdmin(orderId, user.id);
  revalidatePath(`/pedido/${orderId}`);
  return { message: result.message };
}

/** Lee el estado real del pedido desde el servidor (para el diálogo). */
export async function getOrderStatus(orderId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from('orders').select('status').eq('id', orderId).maybeSingle();
  return data?.status ?? null;
}
