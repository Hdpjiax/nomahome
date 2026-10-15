import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategories, getPiecesByCategory } from '@/lib/catalog/queries';
import type { SortOrder } from '@/lib/catalog/types';
import PieceCard from '@/components/store/PieceCard';
import FiltersPanel from '@/components/store/FiltersPanel';
import EmptyState from '@/components/store/EmptyState';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function centsParam(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isSafeInteger(n) && n >= 0 ? n : undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name} — NOMAHOME`,
    description:
      category.description ??
      `Catálogo de ${category.name.toLowerCase()} hecho en el taller de Morelia.`,
    alternates: { canonical: `/categoria/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const orden = single(sp['orden']);
  const filters = {
    color: single(sp['color']),
    material: single(sp['material']),
    priceMinCents: centsParam(single(sp['precio_min'])),
    priceMaxCents: centsParam(single(sp['precio_max'])),
    orden: (orden as SortOrder | undefined) ?? 'reciente',
  };

  const pieces = await getPiecesByCategory(slug, filters);

  // Opciones de filtro: lo que existe en ESTA categoría.
  const allInCategory = await getPiecesByCategory(slug);
  const colorMap = new Map<string, { name: string; hex: string }>();
  for (const p of allInCategory) for (const c of p.colors) colorMap.set(c.name, c);
  const materials = [...new Set(allInCategory.flatMap((p) => p.materials))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">
            <Link href="/" className="hover:underline">Catálogo</Link> / {category.name}
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
              {category.description}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
          <div className="col-span-12 md:col-span-3">
            <FiltersPanel
              baseSlug={slug}
              colors={[...colorMap.values()]}
              materials={materials}
            />
          </div>

          <div className="col-span-12 md:col-span-9">
            {pieces.length === 0 ? (
              <EmptyState
                title="Ese color no tiene piezas en taller."
                note="Cambiar de color a veces es cuestión de una semana: pregunta por WhatsApp y te decimos qué hay en obra."
                action={
                  <Link href={`/categoria/${slug}`} className="btn-secondary text-sm">
                    Ver toda la categoría
                  </Link>
                }
              />
            ) : (
              <p className="text-catalog mb-[var(--space-4)]" aria-live="polite">
                {pieces.length} {pieces.length === 1 ? 'pieza' : 'piezas'}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-[var(--space-5)] gap-y-[var(--space-7)]">
              {pieces.map((piece, i) => (
                <PieceCard key={piece.id} piece={piece} withActions priority={i === 0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
