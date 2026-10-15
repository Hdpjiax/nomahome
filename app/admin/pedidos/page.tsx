import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';
import OrderPaymentActions from './OrderPaymentActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pedidos · Taller', robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Por cobrar',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  fulfilled: 'Entregado',
};

/** Pedidos del taller (§8 admin): surtido; el pago solo se CONFIRMA, nunca se edita a mano. */
export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const [{ data: orders }, { data: payments }] = await Promise.all([
    admin
      .from('orders')
      .select('id, public_ref, email, status, total_cents, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(100),
    admin.from('payments').select('order_id, status, raw_status, reference, method'),
  ]);

  const payByOrder = new Map(
    (payments ?? []).map((p) => [p.order_id, p])
  );

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-2)]">Taller · surtido</p>
      <h1 className="font-display font-semibold text-4xl tracking-[-0.02em] mb-[var(--space-5)]">
        Pedidos
      </h1>
      <p className="text-xs text-[var(--ink-soft)] max-w-2xl mb-[var(--space-5)] leading-relaxed">
        Aquí se ve el surtido. El pago no se edita a mano: se CONFIRMA contra
        el estado de cuenta del banco (acción con bitácora) o se marca en
        revisión — y marcar revisión no es pagar.
      </p>

      <div className="border border-[var(--line)] rounded-[var(--radius-m)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] text-left">
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Folio</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Correo</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Total</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Estado</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Pago</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]"></th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {(orders ?? []).map((o) => {
              const pay = payByOrder.get(o.id);
              return (
                <tr key={o.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper-2)]/60">
                  <td className="px-[var(--space-3)] py-[var(--space-2)] whitespace-nowrap">
                    <Link href={`/pedido/${o.id}`} className="underline underline-offset-4 decoration-[var(--brass)]">
                      {o.public_ref ?? o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] font-ui text-xs">{o.email}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">
                    {formatMXN(o.total_cents)}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    <span
                      className={`text-xs uppercase tracking-[0.06em] ${
                        o.status === 'paid' || o.status === 'fulfilled'
                          ? 'text-[var(--ok)]'
                          : o.status === 'cancelled'
                            ? 'text-[var(--danger)]'
                            : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    {pay ? (
                      <span className="text-[11px] text-[var(--ink-soft)]">
                        {pay.status}
                        {pay.raw_status && pay.raw_status !== 'awaiting_transfer'
                          ? ` · ${pay.raw_status}`
                          : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    {o.status === 'pending_payment' ? (
                      <OrderPaymentActions orderId={o.id} />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
