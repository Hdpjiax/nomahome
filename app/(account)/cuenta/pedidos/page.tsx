import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AccountNav } from '../../layout';
import PageFade from '@/components/motion/PageFade';
import { formatMXN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tus pedidos — NOMAHOME',
  robots: { index: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Por pagar',
  paid: 'Pagado',
  cancelled: 'Cancelado',
  fulfilled: 'Entregado',
};

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect('/cuenta');

  const supabase = await createSupabaseServerClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, public_ref, status, total_cents, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const orderIds = (orders ?? []).map((o) => o.id);
  const itemsByOrder = new Map<string, { sku: string; name: string; qty: number }[]>();
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, sku_snapshot, name_snapshot, qty')
      .in('order_id', orderIds);
    for (const it of items ?? []) {
      const list = itemsByOrder.get(it.order_id) ?? [];
      list.push({ sku: it.sku_snapshot, name: it.name_snapshot, qty: it.qty });
      itemsByOrder.set(it.order_id, list);
    }
  }

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Tus pedidos
        </h1>

        <AccountNav active="pedidos" />

        {error || (orders ?? []).length === 0 ? (
          <div className="border-t border-b border-[var(--line)] py-[var(--space-7)]">
            <h2 className="font-display text-2xl mb-[var(--space-3)]">Todavía sin pedidos.</h2>
            <p className="text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
              Cuando hagas tu primer pedido aparece aquí con su folio, sus
              piezas y su estado de taller.
            </p>
            <Link href="/categoria/muebles" className="btn-primary mt-[var(--space-5)] inline-block text-sm">
              Recorrer el catálogo
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {(orders ?? []).map((o) => (
              <li key={o.id} className="py-[var(--space-5)]">
                <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
                  <div>
                    <p className="text-catalog">
                      {o.public_ref ?? o.id.slice(0, 8)} ·{' '}
                      {new Date(o.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <ul className="mt-[var(--space-2)] text-sm text-[var(--ink-soft)]">
                      {(itemsByOrder.get(o.id) ?? []).map((it, i) => (
                        <li key={i}>
                          {it.qty} × {it.name}{' '}
                          <span className="font-mono text-xs">({it.sku})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-semibold">{formatMXN(o.total_cents)}</p>
                    <p
                      className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
                        o.status === 'paid' || o.status === 'fulfilled'
                          ? 'text-[var(--ok)]'
                          : o.status === 'cancelled'
                            ? 'text-[var(--danger)]'
                            : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                    <Link
                      href={`/pedido/${o.id}`}
                      className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
                    >
                      Ver el pedido
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageFade>
  );
}
