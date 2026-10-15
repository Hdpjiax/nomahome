'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { fiscalDataSchema } from '@/lib/validators/invoice';
import { splitIva } from '@/lib/money';
import {
  isFacturapiConfigured,
  stampInvoice,
  cancelInvoice,
  resendInvoiceByEmail,
} from '@/lib/invoicing/facturapi';

export type InvoiceState =
  | { status: 'idle' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string };

/**
 * Pedir factura (§6 facturacion-cfdi):
 *  - solo pedidos pagados, una vez (salvo cancelación previa),
 *  - sin llave de Facturapi: estado 'timbrado no configurado',
 *  - jamás un XML o PDF casero.
 */
export async function requestInvoiceAction(
  orderId: string,
  fiscal: unknown
): Promise<InvoiceState> {
  const user = await getSessionUser();
  if (!user) return { status: 'error', message: 'Entra a tu cuenta para pedir factura.' };

  const parsed = fiscalDataSchema.safeParse(fiscal);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();

  // El pedido es del usuario y está pagado.
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status, email, total_cents, shipping_cents, public_ref')
    .eq('id', orderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id) {
    return { status: 'error', message: 'Ese pedido no es tuyo.' };
  }
  if (order.status !== 'paid' && order.status !== 'fulfilled') {
    return { status: 'error', message: 'La factura se pide con el pedido pagado.' };
  }

  // ¿Ya hay factura vigente? Cancelada permite volver a timbrar.
  const { data: existing } = await admin
    .from('invoices')
    .select('id, status')
    .eq('order_id', orderId)
    .maybeSingle();
  if (existing && existing.status !== 'canceled') {
    return { status: 'error', message: 'Este pedido ya tiene factura.' };
  }

  const { data: items } = await admin
    .from('order_items')
    .select('name_snapshot, qty, unit_price_cents')
    .eq('order_id', orderId);

  // Renglones NETOS de IVA: el precio de vitrina lo trae incluido.
  const lines = (items ?? []).map((i) => {
    const gross = i.unit_price_cents * i.qty;
    return {
      name: i.name_snapshot,
      quantity: 1,
      unitNetCents: splitIva(gross).subtotalCents,
    };
  });

  // Sin llave: guardamos la solicitud, sin inventar folios ni PDF.
  if (!isFacturapiConfigured()) {
    const { error } = await admin.from('invoices').upsert(
      {
        order_id: orderId,
        rfc: parsed.data.rfc,
        legal_name: parsed.data.legalName,
        tax_regime: parsed.data.taxSystem,
        cfdi_use: parsed.data.cfdiUse,
        postal_code: parsed.data.postalCode,
        status: 'requested',
      },
      { onConflict: 'order_id' }
    );
    if (error) return { status: 'error', message: 'No se pudo registrar la solicitud.' };
    revalidatePath('/cuenta/facturacion');
    return {
      status: 'error',
      message:
        'Timbrado no configurado: tu solicitud quedó registrada y el taller la timbra cuando conecte su cuenta de Facturapi.',
    };
  }

  // Timbrar con Facturapi (CFDI 4.0 real).
  const stamp = await stampInvoice({
    fiscal: {
      rfc: parsed.data.rfc,
      legalName: parsed.data.legalName,
      taxSystem: parsed.data.taxSystem,
      cfdiUse: parsed.data.cfdiUse,
      zip: parsed.data.postalCode,
      email: order.email,
    },
    order: {
      folio: order.public_ref ?? orderId.slice(0, 8),
      totalCents: order.total_cents,
      shippingCents: order.shipping_cents,
      lines,
    },
  });

  if (!stamp.ok) {
    return { status: 'error', message: stamp.error };
  }

  const { error: saveError } = await admin.from('invoices').upsert(
    {
      order_id: orderId,
      rfc: parsed.data.rfc,
      legal_name: parsed.data.legalName,
      tax_regime: parsed.data.taxSystem,
      cfdi_use: parsed.data.cfdiUse,
      postal_code: parsed.data.postalCode,
      uuid: stamp.invoiceId ? stamp.uuid : null,
      status: 'stamped',
      provider_invoice_id: stamp.invoiceId,
      total_cents: order.total_cents,
    },
    { onConflict: 'order_id' }
  );
  if (saveError) return { status: 'error', message: 'La factura se timbró pero no se guardó: avisa al taller.' };

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'invoice.stamped',
    entity: 'invoices',
    entity_id: orderId,
  });

  revalidatePath('/cuenta/facturacion');
  revalidatePath('/admin/facturas');
  return { status: 'ok', message: 'Factura timbrada. Te llega por correo y la ves aquí.' };
}

/** Cancelar CFDI — solo el taller (§6 facturacion-cfdi). */
export async function cancelInvoiceAction(invoiceId: string): Promise<InvoiceState> {
  const user = await getSessionUser();
  if (!user) return { status: 'error', message: 'Solo el taller.' };
  const profile = await getProfile();
  if (profile?.role !== 'admin') return { status: 'error', message: 'Solo el taller.' };

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from('invoices')
    .select('id, provider_invoice_id, status')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!invoice) return { status: 'error', message: 'Factura no encontrada.' };

  if (invoice.provider_invoice_id) {
    // 02: errores con relación — motivo vigente del catálogo del SAT.
    const result = await cancelInvoice(invoice.provider_invoice_id);
    if (!result.ok) return { status: 'error', message: `Facturapi: ${result.error}` };
  }

  const { error } = await admin
    .from('invoices')
    .update({ status: 'canceled' })
    .eq('id', invoiceId);
  if (error) return { status: 'error', message: 'No se pudo cancelar.' };

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'invoice.canceled',
    entity: 'invoices',
    entity_id: invoiceId,
  });

  revalidatePath('/admin/facturas');
  revalidatePath('/cuenta/facturacion');
  return { status: 'ok', message: 'CFDI cancelado. El pedido puede volver a timbrarse.' };
}

/** Reenviar por correo — taller o dueño del pedido. */
export async function resendInvoiceAction(invoiceId: string): Promise<InvoiceState> {
  const user = await getSessionUser();
  if (!user) return { status: 'error', message: 'Necesitas sesión.' };
  const profile = await getProfile();

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from('invoices')
    .select('id, provider_invoice_id, status, orders!inner(user_id, email)')
    .eq('id', invoiceId)
    .maybeSingle();
  if (!invoice) return { status: 'error', message: 'Factura no encontrada.' };

  const order = invoice.orders as unknown as { user_id: string; email: string };
  const isOwner = order.user_id === user.id;
  if (!isOwner && profile?.role !== 'admin') {
    return { status: 'error', message: 'Esa factura no es tuya.' };
  }
  if (invoice.status !== 'stamped') {
    return { status: 'error', message: 'Solo se reenvían facturas timbradas.' };
  }
  if (!invoice.provider_invoice_id) {
    return { status: 'error', message: 'Sin id de Facturapi no hay reenvío.' };
  }

  const result = await resendInvoiceByEmail(invoice.provider_invoice_id, order.email);
  if (!result.ok) return { status: 'error', message: `Facturapi: ${result.error}` };

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'invoice.resent',
    entity: 'invoices',
    entity_id: invoiceId,
  });

  return { status: 'ok', message: `Factura reenviada a ${order.email}.` };
}

/** Marcar un pago en revisión (§8 pedidos): NO equivale a paid. */
export async function markPaymentReviewAction(orderId: string): Promise<InvoiceState> {
  const user = await getSessionUser();
  if (!user) return { status: 'error', message: 'Solo el taller.' };
  const profile = await getProfile();
  if (profile?.role !== 'admin') return { status: 'error', message: 'Solo el taller.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('payments')
    .update({ raw_status: 'under_review' })
    .eq('order_id', orderId)
    .eq('status', 'pending');
  if (error) return { status: 'error', message: 'No se pudo marcar.' };

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'payment.marked_review',
    entity: 'orders',
    entity_id: orderId,
  });

  revalidatePath('/admin/pedidos');
  return { status: 'ok', message: 'Pago marcado en revisión. No cambia el estado del pedido.' };
}
