import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AccountNav } from '../../layout';
import PageFade from '@/components/motion/PageFade';
import InvoiceRequestForm from './InvoiceRequestForm';
import { CFDI_USES, TAX_REGIMES, isFacturapiConfigured } from '@/lib/invoicing/facturapi';
import { formatMXN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Facturación — NOMAHOME',
  description: 'Datos fiscales y facturas CFDI 4.0 de tus pedidos pagados.',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitada · timbrado pendiente',
  stamped: 'Timbrada',
  canceled: 'Cancelada',
};

/** Facturación (§8 cuenta): CFDI 4.0 solo de pedidos pagados. */
export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/cuenta');

  const supabase = await createSupabaseServerClient();
  const [{ data: orders }, { data: invoices }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, public_ref, total_cents, status, created_at')
      .in('status', ['paid', 'fulfilled'])
      .order('created_at', { ascending: false }),
    supabase.from('invoices').select('*'),
  ]);

  const invoiceByOrder = new Map((invoices ?? []).map((i) => [i.order_id, i]));
  const configured = isFacturapiConfigured();

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Facturación
        </h1>

        <AccountNav active="facturacion" />

        <p className="mb-[var(--space-5)] text-sm text-[var(--ink-soft)] max-w-xl leading-relaxed">
          La factura CFDI 4.0 se pide con el pedido pagado, una sola vez,
          salvo cancelación. El timbrado lo hace Facturapi, emisor autorizado
          del SAT: aquí no hay XML caseros.
        </p>

        {(orders ?? []).length === 0 ? (
          <div className="border-t border-b border-[var(--line)] py-[var(--space-7)]">
            <h2 className="font-display text-2xl mb-[var(--space-3)]">
              Todavía sin pedidos pagados.
            </h2>
            <p className="text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
              Cuando un pedido tuyo pase a pagado, pides su factura aquí con
              tus datos fiscales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-[var(--space-5)]">
            {(orders ?? []).map((o) => {
              const invoice = invoiceByOrder.get(o.id);
              return (
                <div key={o.id} className="col-span-12 md:col-span-6">
                  <div className="flex items-baseline justify-between gap-[var(--space-3)] mb-[var(--space-2)]">
                    <p className="font-display text-lg">{o.public_ref}</p>
                    <p className="font-mono text-sm">{formatMXN(o.total_cents)}</p>
                  </div>
                  {invoice ? (
                    <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
                      <p className="font-mono text-xs mb-2">
                        RFC {invoice.rfc}
                      </p>
                      <p
                        className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
                          invoice.status === 'stamped'
                            ? 'text-[var(--ok)]'
                            : invoice.status === 'canceled'
                              ? 'text-[var(--danger)]'
                              : 'text-[var(--ink-soft)]'
                        }`}
                      >
                        {STATUS_LABEL[invoice.status] ?? invoice.status}
                      </p>
                      {invoice.uuid ? (
                        <p className="mt-2 font-mono text-[11px] text-[var(--ink-soft)] break-all">
                          UUID {invoice.uuid}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <InvoiceRequestForm
                      orderId={o.id}
                      folio={o.public_ref ?? 'Pedido'}
                      uses={CFDI_USES}
                      regimes={TAX_REGIMES}
                      configured={configured}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageFade>
  );
}
