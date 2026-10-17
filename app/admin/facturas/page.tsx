import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';
import { isFacturapiConfigured } from '@/lib/invoicing/facturapi';
import InvoiceActions from '@/components/admin/InvoiceActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Facturas · Taller', robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitada · sin timbrar',
  stamped: 'Timbrada',
  canceled: 'Cancelada',
};

/** Facturas (§8 admin): RFC, UUID, estado, reenviar y cancelar el CFDI. */
export default async function AdminInvoicesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('invoices')
    .select(
      `id, rfc, legal_name, cfdi_use, uuid, status, total_cents, created_at,
       orders!inner(id, public_ref, email)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((i) => {
    const order = i.orders as unknown as { id: string; public_ref: string; email: string };
    return { ...i, order };
  });

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-2)]">Taller · CFDI</p>
      <h1 className="font-display font-semibold text-4xl tracking-[-0.02em] mb-[var(--space-5)]">
        Facturas
      </h1>

      {!isFacturapiConfigured() ? (
        <p className="text-xs text-[var(--brass)] border-l-2 border-[var(--brass)] pl-[var(--space-3)] mb-[var(--space-5)] max-w-xl leading-relaxed">
          Timbrado no configurado: sin FACTURAPI_KEY las solicitudes se registran como “sin
          timbrar”. No se generan XML ni PDF caseros.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">
          Sin facturas todavía. Aparecen cuando un cliente con pedido pagado pide la suya.
        </p>
      ) : (
        <div className="border border-[var(--line)] rounded-[var(--radius-m)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] text-left">
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Pedido</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">RFC</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Razón social</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">UUID</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Total</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]">Estado</th>
                <th className="px-[var(--space-3)] py-[var(--space-2)]"></th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper-2)]/60"
                >
                  <td className="px-[var(--space-3)] py-[var(--space-2)] whitespace-nowrap">
                    <Link
                      href={`/pedido/${i.order.id}`}
                      className="underline underline-offset-4 decoration-[var(--brass)]"
                    >
                      {i.order.public_ref}
                    </Link>
                    <span className="block text-[10px] text-[var(--ink-soft)] font-ui">
                      {i.order.email}
                    </span>
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-xs">{i.rfc}</td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] font-ui text-xs">
                    {i.legal_name}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-[10px] max-w-32 break-all text-[var(--ink-soft)]">
                    {i.uuid ?? '—'}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">
                    {i.total_cents ? formatMXN(i.total_cents) : '—'}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    <span
                      className={`text-[11px] uppercase tracking-[0.06em] ${
                        i.status === 'stamped'
                          ? 'text-[var(--ok)]'
                          : i.status === 'canceled'
                            ? 'text-[var(--danger)]'
                            : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {STATUS_LABEL[i.status] ?? i.status}
                    </span>
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    <InvoiceActions invoiceId={i.id} status={i.status} />
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
