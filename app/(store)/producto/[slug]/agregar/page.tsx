import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPieceBySlug } from '@/lib/catalog/queries';
import QuickAdd from '@/components/store/QuickAdd';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const piece = await getPieceBySlug(slug);
  return {
    title: piece ? `Agregar ${piece.name} — NOMAHOME` : 'Agregar — NOMAHOME',
    robots: { index: false },
  };
}

/**
 * Ruta ligera de agregado rápido (§8): el mismo componente QuickAdd del
 * sheet de listados. No es una segunda ficha con el mismo scroll infinito.
 */
export default async function QuickAddPage({ params }: PageProps) {
  const { slug } = await params;
  const piece = await getPieceBySlug(slug);
  if (!piece) notFound();

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-6)] pb-[var(--space-8)]">
        <div className="max-w-xl mx-auto">
          <p className="text-catalog mb-[var(--space-3)]">
            <Link href={`/producto/${piece.slug}`} className="hover:underline">
              ← Volver a la ficha completa
            </Link>
          </p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-[-0.02em] mb-[var(--space-5)]">
            Elegir rápido
          </h1>
          <QuickAdd piece={piece} />
        </div>
      </div>
    </PageFade>
  );
}
