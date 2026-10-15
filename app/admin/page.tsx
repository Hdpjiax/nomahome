import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Taller · NOMAHOME',
  robots: { index: false },
};

/** Resumen del taller (§8 admin): por cobrar, pagados hoy, stock bajo, reseñas. */
export default async function AdminHome() {
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);

  const [pendingOrders, paidToday, lowStock, pendingReviews, paymentsToday] =
    await Promise.all([
      admin
        .from('orders')
        .select('id, public_ref, total_cents, created_at', { count: 'exact', head: false })
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'paid')
        .gte('updated_at', `${today}T00:00:00`),
      admin
        .from('product_variants')
        .select('sku, stock, price_cents, products(name, slug)')
        .lte('stock', 3)
        .eq('published', true)
        .limit(8),
      admin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      admin
        .from('payments')
        .select('net_cents')
        .eq('status', 'approved')
        .gte('updated_at', `${today}T00:00:00`),
    ]);

  const stats = [
    {
      label: 'Por cobrar',
      value: pendingOrders.count ?? 0,
      note: 'pedidos esperando transferencia',
      href: '/admin/pedidos',
    },
    {
      label: 'Pagados hoy',
      value: paidToday.count ?? 0,
      note: 'confirmados por el taller',
      href: '/admin/pedidos',
    },
    {
      label: 'Cobrado hoy',
      value: formatMXN((paymentsToday.data ?? []).reduce((n, p) => n + p.net_cents, 0)),
      note: 'neto del ledger',
      href: '/admin/pagos',
    },
    {
      label: 'Reseñas por revisar',
      value: pendingReviews.count ?? 0,
      note: 'compras verificadas',
      href: '/admin/resenas',
    },
  ];

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-3)]">Taller · resumen</p>
      <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.02em] mb-[var(--space-6)]">
        El taller hoy.
      </h1>

      <div className="grid grid-cols-12 gap-[var(--space-4)] mb-[var(--space-7)]">
        {stats.map((s) => (
          <div key={s.label} className="col-span-6 md:col-span-3 border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">{s.label}</p>
            <p className="font-display text-3xl mt-[var(--space-2)]">{s.value}</p>
            <p className="text-xs text-[var(--ink-soft)] mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
        <section className="col-span-12 md:col-span-6">
          <h2 className="font-display text-xl mb-[var(--space-3)]">Por cobrar</h2>
          {(pendingOrders.data ?? []).length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Nada pendiente. Todo cobrado.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] font-mono text-sm">
              {(pendingOrders.data ?? []).map((o) => (
                <li key={o.id} className="py-[var(--space-2)] flex justify-between">
                  <span>{o.public_ref}</span>
                  <span>{formatMXN(o.total_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="col-span-12 md:col-span-6">
          <h2 className="font-display text-xl mb-[var(--space-3)]">Stock bajo (≤ 3)</h2>
          {(lowStock.data ?? []).length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Todo con piezas en taller.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] font-mono text-sm">
              {(lowStock.data ?? []).map((v) => (
                <li key={v.sku} className="py-[var(--space-2)] flex justify-between gap-2">
                  <Link
                    href={`/producto/${(v.products as { slug: string }).slug}`}
                    className="underline underline-offset-4 decoration-[var(--brass)]"
                  >
                    {v.sku}
                  </Link>
                  <span className={v.stock === 0 ? 'text-[var(--danger)]' : ''}>
                    {v.stock} en taller
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-[var(--space-7)] pt-[var(--space-5)] border-t border-[var(--line)] flex flex-wrap gap-[var(--space-5)] font-mono text-sm">
        <Link href="/admin/productos" className="btn-primary text-sm">Administrar productos</Link>
        <Link href="/admin/inicio" className="btn-secondary text-sm">Reordenar el home</Link>
        <Link href="/admin/resenas" className="btn-secondary text-sm">
          Reseñas ({pendingReviews.count ?? 0})
        </Link>
      </div>
    </div>
  );
}
