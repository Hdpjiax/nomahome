import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getGuestOrderTokens } from '@/lib/checkout/guest-access';
import { isSandbox } from '@/lib/payments/signature';
import PageFade from '@/components/motion/PageFade';
import SimulatePaymentButton from './SimulatePaymentButton';
import ReviewForm from '@/components/store/ReviewForm';
import { getMyReviewsForOrder } from '@/lib/reviews/actions';
import { formatMXN } from '@/lib/money';
import { waLink, waOrder } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: 'Tu pedido — NOMAHOME',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Por pagar',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  fulfilled: 'Entregado',
};

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();

  // Acceso (§8 pedido): dueño con sesión, o invitado con el token del
  // pedido en cookie httpOnly que cruza contra la base. Nadie más.
  const user = await getSessionUser();
  let allowed = Boolean(user && order.user_id === user.id);
  if (!allowed && !order.user_id && order.guest_token) {
    const tokens = await getGuestOrderTokens();
    allowed = tokens.get(order.id) === order.guest_token;
  }
  if (!allowed) notFound();

  const [{ data: items }, { data: payment }] = await Promise.all([
    admin.from('order_items').select('*').eq('order_id', order.id),
    admin
      .from('payments')
      .select('provider, status, method, reference')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const address = order.address_snapshot as {
    recipient: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    phone: string;
  };

  const myReviews =
    user && order.user_id === user.id && order.status === 'paid'
      ? await getMyReviewsForOrder(order.id)
      : [];

  const clabe = process.env.NEXT_PUBLIC_STORE_CLABE ?? '';
  const bank = process.env.NEXT_PUBLIC_STORE_BANK ?? '';
  const pending = order.status === 'pending_payment';

  const waMessage = waOrder({
    folio: order.public_ref,
    lines: (items ?? []).map((i) => ({
      sku: (i as { sku_snapshot: string }).sku_snapshot,
      qty: (i as { qty: number }).qty,
    })),
    total: formatMXN(order.total_cents),
  });

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)] max-w-4xl">
        <p className="text-catalog mb-[var(--space-3)]">Pedido</p>

        <div className="flex flex-wrap items-end justify-between gap-[var(--space-4)] mb-[var(--space-6)]">
          <h1 className="font-display font-semibold text-5xl md:text-6xl tracking-[-0.02em] leading-none">
            {order.public_ref ?? 'Pedido'}
          </h1>
          <p
            className={`font-mono text-sm uppercase tracking-[0.08em] ${
              order.status === 'paid' || order.status === 'fulfilled'
                ? 'text-[var(--ok)]'
                : order.status === 'cancelled'
                  ? 'text-[var(--danger)]'
                  : 'text-[var(--ink-soft)]'
            }`}
            data-testid="order-status"
          >
            {STATUS_LABEL[order.status] ?? order.status}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
          {/* Piezas y totales */}
          <section className="col-span-12 md:col-span-7">
            <h2 className="font-display text-xl mb-[var(--space-3)]">Piezas</h2>
            <ul className="divide-y divide-[var(--line)] mb-[var(--space-4)]">
              {(items ?? []).map((raw) => {
                const item = raw as {
                  id: string;
                  name_snapshot: string;
                  sku_snapshot: string;
                  unit_price_cents: number;
                  qty: number;
                };
                return (
                  <li key={item.id} className="py-[var(--space-2)] flex justify-between gap-[var(--space-3)] text-sm">
                    <span>
                      {item.qty} × {item.name_snapshot}
                      <span className="block text-xs text-[var(--ink-soft)] font-mono">{item.sku_snapshot}</span>
                    </span>
                    <span className="font-mono">{formatMXN(item.unit_price_cents * item.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="font-mono text-sm space-y-[var(--space-2)]">
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Subtotal</dt>
                <dd>{formatMXN(order.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">Envío</dt>
                <dd>{order.shipping_cents === 0 ? 'Gratis' : formatMXN(order.shipping_cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--ink-soft)]">IVA incluido</dt>
                <dd>{formatMXN(order.tax_cents)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold pt-[var(--space-2)] border-t border-[var(--line)]">
                <dt>Total</dt>
                <dd>{formatMXN(order.total_cents)}</dd>
              </div>
            </dl>
          </section>

          {/* Envío */}
          <section className="col-span-12 md:col-span-5">
            <h2 className="font-display text-xl mb-[var(--space-3)]">Entrega</h2>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              {address.recipient}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
              <br />
              {address.city}, {address.state} · C.P. {address.postal_code}
              <br />
              {address.phone}
            </p>
            <p className="mt-[var(--space-4)] text-xs text-[var(--ink-soft)]">
              Recibo del pedido enviado a <strong className="text-[var(--ink)]">{order.email}</strong>.
            </p>
          </section>

          {/* Cobro SPEI */}
          {pending ? (
            <section className="col-span-12 border-t border-[var(--line)] pt-[var(--space-5)]" aria-labelledby="spei-h">
              <h2 id="spei-h" className="font-display text-2xl mb-[var(--space-3)]">
                Paga por transferencia SPEI
              </h2>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-xl mb-[var(--space-4)]">
                Transfiere el total exacto desde tu banca. Pon la referencia en
                el concepto: con ella el taller concilia tu pago en el banco,
                normalmente el mismo día de taller.
              </p>
              <dl className="font-mono text-sm border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)] grid grid-cols-2 gap-y-[var(--space-2)] max-w-lg bg-[var(--paper-2)]">
                <dt className="text-[var(--ink-soft)]">CLABE</dt>
                <dd className="tabular-nums text-right" data-testid="spei-clabe">{clabe || '— sin configurar —'}</dd>
                <dt className="text-[var(--ink-soft)]">Banco</dt>
                <dd className="text-right">{bank || '—'}</dd>
                <dt className="text-[var(--ink-soft)]">Concepto</dt>
                <dd className="text-right" data-testid="spei-ref">{order.public_ref}</dd>
                <dt className="text-[var(--ink-soft)]">Monto exacto</dt>
                <dd className="text-right font-semibold" data-testid="spei-amount">{formatMXN(order.total_cents)}</dd>
              </dl>
              {payment ? (
                <p className="mt-[var(--space-3)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                  Ledger: {payment.provider ?? 'spei'} · {payment.status} · ref {payment.reference}
                </p>
              ) : null}
              {isSandbox() ? (
                <div className="mt-[var(--space-5)] max-w-lg">
                  <SimulatePaymentButton orderId={order.id} />
                </div>
              ) : null}
            </section>
          ) : (
            <section className="col-span-12 border-t border-[var(--line)] pt-[var(--space-5)]">
              <h2 className="font-display text-2xl mb-[var(--space-3)]">Pagado</h2>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-xl">
                El taller ya vio tu transferencia. Tu pedido entra a la cola de
                surtido con el plazo que viste en la ficha de cada pieza.
              </p>
              {order.user_id ? (
                <p className="mt-[var(--space-3)] text-sm">
                  <Link href="/cuenta/facturacion" className="underline underline-offset-4 decoration-[var(--brass)]">
                    Pedir factura CFDI de este pedido
                  </Link>{' '}
                  — se pide con el pedido pagado.
                </p>
              ) : (
                <p className="mt-[var(--space-3)] text-xs text-[var(--ink-soft)]">
                  Compraste como invitado. Si quieres factura, escríbenos con
                  la referencia {order.public_ref} y te decimos cómo.
                </p>
              )}
            </section>
          )}

          {/* Reseñas de compra verificada: solo el dueño con sesión,
              con el pedido pagado (§8 reseñas). */}
          {order.status === 'paid' && user && order.user_id === user.id ? (
            <section className="col-span-12 border-t border-[var(--line)] pt-[var(--space-5)]" aria-labelledby="resenas-h">
              <h2 id="resenas-h" className="font-display text-2xl mb-[var(--space-3)]">
                ¿Ya la tienes en casa?
              </h2>
              <p className="text-sm text-[var(--ink-soft)] max-w-xl mb-[var(--space-4)] leading-relaxed">
                Escribe cómo te va con cada pieza. Solo se publican reseñas de
                compras verificadas: esta compra.
              </p>
              <div className="grid grid-cols-12 gap-[var(--space-4)]">
                {(items ?? []).map((raw) => {
                  const item = raw as { id: string; variant_id: string; name_snapshot: string; sku_snapshot: string };
                  const mine = myReviews.find((r) => r.variant_id === item.variant_id);
                  return (
                    <div key={item.id} className="col-span-12 md:col-span-6">
                      {mine ? (
                        <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
                          <p className="text-catalog mb-[var(--space-2)]">{item.sku_snapshot}</p>
                          <p className="font-mono text-xs text-[var(--brass)] mb-[var(--space-2)]">
                            {'★'.repeat(mine.rating)}
                            <span className="text-[var(--line)]">{'★'.repeat(5 - mine.rating)}</span>
                          </p>
                          <p className="text-xs text-[var(--ink-soft)]">
                            {mine.status === 'pending'
                              ? 'En revisión del taller. Aparece cuando se publique.'
                              : mine.status === 'published'
                                ? 'Publicada en la ficha de la pieza.'
                                : 'El taller no publicó esta reseña.'}
                          </p>
                        </div>
                      ) : (
                        <ReviewForm
                          variantId={item.variant_id}
                          orderId={order.id}
                          variantLabel={item.sku_snapshot}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-[var(--space-7)] pt-[var(--space-5)] border-t border-[var(--line)] flex flex-wrap gap-[var(--space-5)]">
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Hablar del pedido por WhatsApp
          </a>
          <Link href="/" className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]">
            Volver al catálogo
          </Link>
        </div>
      </div>
    </PageFade>
  );
}
