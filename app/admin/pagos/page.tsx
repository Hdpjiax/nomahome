import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Pagos · Taller', robots: { index: false } };

/**
 * Ledger de pagos (§8 admin): solo lectura operativa. Cada renglón nace
 * con el pedido (pending) y lo cierra el webhook firmado o la confirmación
 * del taller. Sin columnas de tarjeta porque nunca se capturan.
 */
export default async function AdminPaymentsPage() {
  const admin = createAdminClient();
  const { data: payments } = await admin
    .from('payments')
    .select(
      `id, provider, provider_payment_id, status, method, reference,
       amount_cents, fee_cents, net_cents, raw_status, created_at, updated_at,
       orders!inner(id, public_ref, email)`
    )
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (payments ?? []).map((p) => {
    const order = p.orders as unknown as { id: string; public_ref: string; email: string };
    return { ...p, order };
  });

  const totalNet = rows
    .filter((p) => p.status === 'approved')
    .reduce((n, p) => n + p.net_cents, 0);

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-2)]">Taller · ledger</p>
      <h1 className="font-display font-semibold text-4xl tracking-[-0.02em] mb-[var(--space-5)]">
        Pagos
      </h1>
      <p className="font-mono text-sm mb-[var(--space-5)]">
        Neto aprobado: <strong>{formatMXN(totalNet)}</strong>
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">
          Sin pagos todavía. Los renglones nacen cuando hay pedidos.
        </p>
      ) : (
        <div className="border border-[var(--line)] rounded-[var(--radius-m)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] text-left">
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Pedido</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Provider id</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Método</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Ref</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Monto</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Comisión</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Neto</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Estado</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper-2)]/60">
                  <td className="px-[var(--space-3)] py-[var(--space-2)] whitespace-nowrap">
                    <Link href={`/pedido/${p.order.id}`} className="underline underline-offset-4 decoration-[var(--brass)]">
                      {p.order.public_ref}
                    </Link>
                    <span className="block text-[10px] text-[var(--ink-soft)] font-ui">{p.order.email}</span>
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-[11px] text-[var(--ink-soft)]">
                    {p.provider_payment_id ?? '—'}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-xs">{p.method ?? '—'}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-xs">{p.reference ?? '—'}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">{formatMXN(p.amount_cents)}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">{formatMXN(p.fee_cents)}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">{formatMXN(p.net_cents)}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    <span
                      className={`text-[11px] uppercase tracking-[0.06em] ${
                        p.status === 'approved'
                          ? 'text-[var(--ok)]'
                          : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {p.status}
                      {p.raw_status ? ` · ${p.raw_status}` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
