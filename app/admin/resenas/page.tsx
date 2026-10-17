import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';
import ReviewDecision from '@/components/admin/ReviewDecision';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Reseñas · Taller', robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  pending: 'En revisión',
  published: 'Publicada',
  rejected: 'Rechazada',
};

/** Moderación de reseñas (§8 admin): publicar o rechazar. */
export default async function AdminReviewsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('reviews')
    .select(
      `id, rating, title, body, author_name, status, created_at,
       product_variants(sku, price_cents, products(name, slug))`
    )
    .order('created_at', { ascending: false })
    .limit(50);

  type Row = NonNullable<typeof data>[number] & {
    product_variants: {
      sku: string;
      price_cents: number;
      products: { name: string; slug: string } | null;
    } | null;
  };

  const reviews = (data ?? []) as Row[];
  const pending = reviews.filter((r) => r.status === 'pending');

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-2)]">Taller · moderación</p>
      <h1 className="font-display font-semibold text-4xl tracking-[-0.02em] mb-[var(--space-5)]">
        Reseñas{' '}
        <span className="font-mono text-base text-[var(--ink-soft)]">
          ({pending.length} en revisión)
        </span>
      </h1>

      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">
          Sin reseñas todavía. Llegan cuando haya compras pagadas.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {reviews.map((r) => (
            <li key={r.id} className="py-[var(--space-4)] flex flex-wrap gap-[var(--space-4)]">
              <div className="flex-1 min-w-64">
                <p className="font-mono text-xs text-[var(--brass)] mb-1">
                  {'★'.repeat(r.rating)}
                  <span className="text-[var(--line)]">{'★'.repeat(5 - r.rating)}</span>
                  <span className="ml-2 text-[var(--ink-soft)]">
                    {r.product_variants?.sku} · {r.product_variants?.products?.name}
                  </span>
                </p>
                {r.title ? <p className="font-semibold text-sm">{r.title}</p> : null}
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed mt-1 max-w-2xl">
                  {r.body}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                  {r.author_name} · compra verificada
                  {r.product_variants ? ` · ${formatMXN(r.product_variants.price_cents)}` : ''}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
                    r.status === 'published'
                      ? 'text-[var(--ok)]'
                      : r.status === 'rejected'
                        ? 'text-[var(--danger)]'
                        : 'text-[var(--ink-soft)]'
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </p>
                <ReviewDecision reviewId={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
