import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPieceBySlug,
  getProductReviews,
  getProductTabs,
  getRelatedPieces,
} from '@/lib/catalog/queries';
import ProductStage from '@/components/store/ProductStage';
import EditorialTabs from '@/components/store/EditorialTabs';
import PieceCard from '@/components/store/PieceCard';
import PageFade from '@/components/motion/PageFade';
import { formatMXN, shippingCents } from '@/lib/money';
import { waLink, waQuestion } from '@/lib/whatsapp';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

/** ¿La pieza está guardada en favoritos del usuario actual? */
async function isFavorited(productId: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();
  return Boolean(data);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const piece = await getPieceBySlug(slug);
  if (!piece) return {};
  return {
    title: piece.seoTitle ?? `${piece.name} — NOMAHOME`,
    description:
      piece.seoDescription ??
      piece.summary ??
      `${piece.name}, pieza de taller con medida, material y precio a la vista.`,
    alternates: { canonical: `/producto/${slug}` },
    openGraph: {
      type: 'website',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: piece.name }],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const piece = await getPieceBySlug(slug);
  if (!piece) notFound();

  const [tabs, reviews, related, favorited] = await Promise.all([
    getProductTabs(piece.id),
    getProductReviews(piece.id),
    getRelatedPieces(piece),
    isFavorited(piece.id),
  ]);

  const prices = piece.variants.map((v) => v.priceCents);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: piece.name,
    sku: piece.sku,
    description: piece.summary ?? piece.description ?? undefined,
    image: piece.variants[0]?.media[0]?.path,
    brand: { '@type': 'Brand', name: 'NOMAHOME' },
    category: piece.categories[0]?.name,
    color: piece.variants.map((v) => v.color.name).join(', '),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MXN',
      lowPrice: (Math.min(...prices) / 100).toFixed(2),
      highPrice: (Math.max(...prices) / 100).toFixed(2),
      offerCount: piece.variants.length,
      availability: piece.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  const shipping = shippingCents(piece.priceCents, 'Michoacán');

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-6)] pb-[var(--space-8)]">
        <nav aria-label="Miga de pan" className="text-catalog mb-[var(--space-5)]">
          <Link href="/" className="hover:underline">Catálogo</Link>
          {piece.categories[0] ? (
            <>
              {' / '}
              <Link href={`/categoria/${piece.categories[0].slug}`} className="hover:underline">
                {piece.categories[0].name}
              </Link>
            </>
          ) : null}
          {' / '}
          <span>{piece.name}</span>
        </nav>

        <ProductStage piece={piece} favorited={favorited} />

        {piece.description ? (
          <section className="mt-[var(--space-7)] max-w-2xl">
            <p className="text-[var(--ink-soft)] leading-relaxed whitespace-pre-line">
              {piece.description}
            </p>
          </section>
        ) : null}

        {/* Nota de taller: envío y avisos */}
        <section className="mt-[var(--space-7)] border-t border-b border-[var(--line)] py-[var(--space-5)] grid grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-3)] text-sm">
          <p className="col-span-12 md:col-span-4 text-[var(--ink-soft)] leading-relaxed">
            <strong className="text-[var(--ink)]">Envío:</strong>{' '}
            {shipping === 0
              ? 'Esta pieza viaja gratis a cualquier parte de México.'
              : `desde ${formatMXN(shippingCents(piece.priceCents, 'Michoacán'))} dentro de Michoacán y ${formatMXN(shippingCents(piece.priceCents, 'CDMX'))} al resto de México.`}
          </p>
          <p className="col-span-12 md:col-span-4 text-[var(--ink-soft)] leading-relaxed">
            <strong className="text-[var(--ink)]">Preguntas de medida:</strong>{' '}
            si dudas si cabe por tu puerta o escalera, pregunta antes de comprar.
          </p>
          <p className="col-span-12 md:col-span-4">
            <a
              href={waLink(waQuestion(piece.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]"
            >
              Hablar de esta pieza por WhatsApp →
            </a>
          </p>
        </section>

        {/* Pestañas ordenadas por el admin */}
        <section className="mt-[var(--space-7)]">
          <EditorialTabs tabs={tabs} />
        </section>

        {/* Reseñas */}
        <section className="mt-[var(--space-7)]" aria-labelledby="resenas-pieza">
          <h2 id="resenas-pieza" className="font-display text-2xl mb-[var(--space-4)]">
            Reseñas {reviews.length > 0 ? `(${reviews.length})` : ''}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-lg">
              Sin reseñas todavía. La primera llega cuando alguien ya viva con
              esta pieza: solo se publican reseñas de compras verificadas.
            </p>
          ) : (
            <div className="grid grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-5)]">
              {reviews.map((r) => (
                <article key={r.id} className="col-span-12 md:col-span-6 border-t border-[var(--line)] pt-[var(--space-3)]">
                  <p className="font-mono text-xs text-[var(--brass)] mb-[var(--space-2)]">
                    {'★'.repeat(r.rating)}
                    <span className="text-[var(--line)]">{'★'.repeat(5 - r.rating)}</span>
                    <span className="ml-2 text-[var(--ink-soft)]">{r.variantSku}</span>
                  </p>
                  {r.title ? <p className="font-semibold">{r.title}</p> : null}
                  <p className="mt-[var(--space-2)] text-sm text-[var(--ink-soft)] leading-relaxed">
                    {r.body}
                  </p>
                  <p className="mt-[var(--space-2)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                    {r.authorName} · compra verificada
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Relacionados */}
        {related.length > 0 ? (
          <section className="mt-[var(--space-7)]" aria-labelledby="relacionadas">
            <h2 id="relacionadas" className="font-display text-2xl mb-[var(--space-5)]">
              De la misma categoría
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-[var(--space-5)] gap-y-[var(--space-6)]">
              {related.map((p) => (
                <PieceCard key={p.id} piece={p} />
              ))}
            </div>
          </section>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </PageFade>
  );
}
