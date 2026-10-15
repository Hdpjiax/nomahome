import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Aplicador de pagos aprobados — el ÚNICO lugar que pasa un pedido a paid
 * y descuenta stock (§ checkout skill, regla 8). Lo usan:
 *   - la confirmación del taller (rol admin verificado en servidor), y
 *   - el webhook firmado (solo sandbox), tras verificar la firma HMAC.
 *
 * Idempotencia doble:
 *   1. por provider_payment_id (único en payments), y
 *   2. por estado del pedido: solo pending_payment pasa a paid.
 * Un reintento jamás descuenta stock dos veces.
 */
export type ApprovedPaymentInput = {
  orderId: string;
  amountCents: number;
  providerPaymentId: string | null;
  provider: 'spei';
  method: string;
  rawStatus: string;
  actorId: string | null;
};

export type ApprovedPaymentResult =
  | { ok: true; alreadyApplied: boolean }
  | { ok: false; error: string };

export async function applyApprovedPayment(
  input: ApprovedPaymentInput
): Promise<ApprovedPaymentResult> {
  const admin = createAdminClient();

  // 1. Idempotencia por id de pago: si ya se aplicó, salimos con éxito.
  if (input.providerPaymentId) {
    const { data: existing } = await admin
      .from('payments')
      .select('id, status')
      .eq('provider_payment_id', input.providerPaymentId)
      .maybeSingle();
    if (existing && existing.status === 'approved') {
      return { ok: true, alreadyApplied: true };
    }
  }

  // 2. El pedido debe existir y estar en pending_payment.
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, status, total_cents, public_ref')
    .eq('id', input.orderId)
    .maybeSingle();
  if (orderError) throw new Error(`orders: ${orderError.message}`);
  if (!order) return { ok: false, error: 'Pedido no encontrado.' };
  if (order.status === 'paid' || order.status === 'fulfilled') {
    return { ok: true, alreadyApplied: true };
  }
  if (order.status !== 'pending_payment') {
    return { ok: false, error: 'El pedido no está esperando pago.' };
  }

  // 3. El monto debe ser EXACTAMENTE el total del pedido.
  if (input.amountCents !== order.total_cents) {
    return {
      ok: false,
      error: 'El monto del pago no coincide con el total del pedido.',
    };
  }

  // 4. Ledger: actualiza el renglón SPEI del pedido (pending → approved)
  //    o lo crea si vino del webhook.
  const { data: pendingPayment } = await admin
    .from('payments')
    .select('id, status')
    .eq('order_id', input.orderId)
    .eq('provider', 'spei')
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingPayment) {
    const { error: payError } = await admin
      .from('payments')
      .update({
        status: 'approved',
        method: input.method,
        raw_status: input.rawStatus,
        provider_payment_id: input.providerPaymentId,
        net_cents: input.amountCents,
      })
      .eq('id', pendingPayment.id);
    if (payError) throw new Error(`payments update: ${payError.message}`);
  } else {
    const { error: payError } = await admin.from('payments').insert({
      order_id: input.orderId,
      provider: input.provider,
      provider_payment_id: input.providerPaymentId,
      status: 'approved',
      method: input.method,
      reference: order.public_ref,
      amount_cents: input.amountCents,
      fee_cents: 0,
      net_cents: input.amountCents,
      raw_status: input.rawStatus,
    });
    if (payError) throw new Error(`payments insert: ${payError.message}`);
  }

  // 5. Pedido pagado + stock descontado por línea, con clamp en 0.
  const { error: statusError } = await admin
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', input.orderId)
    .eq('status', 'pending_payment'); // guarda de concurrencia
  if (statusError) throw new Error(`orders update: ${statusError.message}`);

  const { data: orderStatus } = await admin
    .from('orders')
    .select('status')
    .eq('id', input.orderId)
    .single();
  if (orderStatus?.status !== 'paid') {
    return { ok: true, alreadyApplied: true }; // otro proceso ganó la carrera
  }

  const { data: items } = await admin
    .from('order_items')
    .select('variant_id, qty')
    .eq('order_id', input.orderId);
  for (const item of items ?? []) {
    const { error: stockError } = await admin.rpc('decrement_variant_stock', {
      p_variant_id: item.variant_id,
      p_qty: item.qty,
    });
    if (stockError) throw new Error(`stock: ${stockError.message}`);
  }

  // 6. Bitácora de auditoría: quién o qué confirmó, sobre qué pedido.
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: input.actorId,
    action: 'payment.approved',
    entity: 'orders',
    entity_id: input.orderId,
  });
  if (auditError) throw new Error(`audit: ${auditError.message}`);

  return { ok: true, alreadyApplied: false };
}
