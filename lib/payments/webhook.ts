import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySignature, isSandbox } from './signature';
import { webhookEventSchema } from '@/lib/validators/payment';
import { applyApprovedPayment } from './confirm';
import { newSimulatedPaymentId } from './reference';

/**
 * Procesa un evento de pago firmado. Ruta: POST /api/webhooks/pagos.
 *
 * Reglas de la skill checkout:
 *   - sin firma válida => 401 y no cambia nada;
 *   - idempotente por provider_payment_id;
 *   - solo monto igual al total pasa el pedido a paid.
 *
 * SOLO existe en sandbox (PAYMENTS_MODE=sandbox). En producción el camino
 * es la confirmación del taller sobre su estado de cuenta bancario.
 */
export type WebhookResult = { status: number; message: string };

export async function processWebhookEvent(
  rawBody: string,
  signature: string | null
): Promise<WebhookResult> {
  if (!isSandbox()) {
    return { status: 404, message: 'No hay webhook de pagos aquí.' };
  }

  const secret = process.env.PAYMENTS_SANDBOX_SECRET;
  if (!secret) {
    return {
      status: 503,
      message: 'Falta configurar PAYMENTS_SANDBOX_SECRET.',
    };
  }

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return { status: 401, message: 'Firma no válida.' };
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, message: 'Cuerpo no es JSON válido.' };
  }

  const parsed = webhookEventSchema.safeParse(event);
  if (!parsed.success) {
    return { status: 422, message: 'El evento no cumple el contrato.' };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from('orders')
    .select('id, total_cents, status')
    .eq('public_ref', parsed.data.public_ref)
    .maybeSingle();
  if (error) throw new Error(`orders: ${error.message}`);
  if (!order) return { status: 404, message: 'Pedido no encontrado.' };

  const result = await applyApprovedPayment({
    orderId: order.id,
    amountCents: parsed.data.amount_cents,
    providerPaymentId: parsed.data.provider_payment_id,
    provider: 'spei',
    method: 'transferencia spei',
    rawStatus: 'sandbox_simulated',
    actorId: null,
  });

  if (!result.ok) return { status: 409, message: result.error };
  return {
    status: 200,
    message: result.alreadyApplied ? 'Ya aplicado antes.' : 'Pago aprobado aplicado.',
  };
}

/**
 * Simulación de pago aprobado (§ instrucción: en sandbox, simula un pago
 * aprobado). Construye el evento, lo firma y lo manda por EL MISMO camino
 * del webhook: si la firma o el contrato fallan, no aplica nada.
 * Solo disponible con PAYMENTS_MODE=sandbox.
 */
export async function simulateApprovedPayment(publicRef: string): Promise<WebhookResult> {
  if (!isSandbox()) {
    return { status: 404, message: 'La simulación solo existe en sandbox.' };
  }
  const secret = process.env.PAYMENTS_SANDBOX_SECRET;
  if (!secret) {
    return { status: 503, message: 'Falta configurar PAYMENTS_SANDBOX_SECRET.' };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, total_cents, status')
    .eq('public_ref', publicRef)
    .maybeSingle();
  if (!order) return { status: 404, message: 'Pedido no encontrado.' };

  const rawBody = JSON.stringify({
    public_ref: publicRef,
    provider_payment_id: newSimulatedPaymentId(),
    status: 'approved',
    amount_cents: order.total_cents,
  });

  const { signPayload } = await import('./signature');
  return processWebhookEvent(rawBody, signPayload(rawBody, secret));
}

/** Confirmación manual del taller: solo admin, con bitácora. */
export async function confirmSpeiPaymentAsAdmin(
  orderId: string,
  actorId: string
): Promise<WebhookResult> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, total_cents, status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { status: 404, message: 'Pedido no encontrado.' };

  const result = await applyApprovedPayment({
    orderId,
    amountCents: order.total_cents,
    providerPaymentId: null,
    provider: 'spei',
    method: 'transferencia spei',
    rawStatus: 'admin_confirmed',
    actorId,
  });
  if (!result.ok) return { status: 409, message: result.error };
  return { status: 200, message: 'Pago confirmado por el taller.' };
}
