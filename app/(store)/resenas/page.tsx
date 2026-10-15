import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import EmptyState from '@/components/store/EmptyState';
import PageFade from '@/components/motion/PageFade';
import { formatMXN } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reseñas — NOMAHOME',
  description: 'Reseñas de compras verificadas: solo quien pagó la pieza la reseña.',
  alternates: { canonical: '/resenas' },
};

type ReviewRow = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
  product_variants: {
    sku: string;
    price_cents: number;
    products: { name: string; slug: string } | null;
  } | null;
};

export default async function ReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `id, rating, title, body, author_name, created_at,
       product_variants!inner(sku, price_cents, products(name, slug))`
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  const reviews = error ? [] : ((data ?? []) as unknown as ReviewRow[]);

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">Reseñas de compras verificadas</p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
            Lo que dicen quienes ya viven con la pieza.
          </h1>
          <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
            Solo se publica la reseña de alguien con un pedido pagado de esa
            pieza. Nada de testimonios de catálogo ajeno.
          </p>
        </header>

        {reviews.length === 0 ? (
          <EmptyState
            title="Todavía no hay reseñas publicadas."
            note="Las primeras reseñas llegan cuando los primeros pedidos se entreguen. Si compraste y tu pedido está pagado, puedes escribir la tuya desde la página del pedido."
          />
        ) : (
          <div className="grid grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-6)]">
            {reviews.map((r) => (
              <article key={r.id} className="col-span-12 md:col-span-6 border-t border-[var(--line)] pt-[var(--space-4)]">
                <p className="text-catalog mb-[var(--space-2)]">
                  {r.product_variants?.sku}
                </p>
                <h2 className="font-display text-xl leading-tight">
                  <Link
                    href={`/producto/${r.product_variants?.products?.slug ?? ''}`}
                    className="hover:underline underline-offset-4 decoration-[var(--brass)]"
                  >
                    {r.product_variants?.products?.name ?? 'Pieza del taller'}
                  </Link>
                </h2>
                <p className="mt-[var(--space-2)] font-mono text-xs text-[var(--brass)]">
                  {'★'.repeat(r.rating)}
                  <span className="text-[var(--line)]">{'★'.repeat(5 - r.rating)}</span>
                </p>
                {r.title ? <p className="mt-[var(--space-3)] font-semibold">{r.title}</p> : null}
                <p className="mt-[var(--space-2)] text-sm text-[var(--ink-soft)] leading-relaxed">
                  {r.body}
                </p>
                <p className="mt-[var(--space-3)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                  {r.author_name} · compra verificada
                  {r.product_variants ? ` · ${formatMXN(r.product_variants.price_cents)}` : ''}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageFade>
  );
}
