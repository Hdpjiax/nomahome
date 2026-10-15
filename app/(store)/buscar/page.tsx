import type { Metadata } from 'next';
import Link from 'next/link';
import { searchPieces } from '@/lib/catalog/queries';
import PieceCard from '@/components/store/PieceCard';
import EmptyState from '@/components/store/EmptyState';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Buscar — NOMAHOME',
  description: 'Busca piezas del taller por nombre, material o descripción.',
  robots: { index: false },
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const pieces = query ? await searchPieces(query) : [];

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">Buscar en el catálogo</p>
          <form action="/buscar" method="get" role="search" className="max-w-2xl">
            <label htmlFor="q" className="sr-only">
              Buscar piezas
            </label>
            <div className="flex items-end gap-[var(--space-3)] border-b-2 border-[var(--ink)] pb-[var(--space-2)]">
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="roble, sofá, lámpara de pie…"
                autoComplete="off"
                className="w-full bg-transparent font-display text-2xl md:text-4xl tracking-[-0.02em] placeholder:text-[var(--ink-soft)]/50 outline-none"
              />
              <button type="submit" className="btn-primary shrink-0 text-sm">
                Buscar
              </button>
            </div>
          </form>
        </header>

        {query ? (
          pieces.length > 0 ? (
            <>
              <p className="text-catalog mb-[var(--space-5)]" aria-live="polite">
                {pieces.length} {pieces.length === 1 ? 'pieza encontrada' : 'piezas encontradas'} para “{query}”
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-[var(--space-5)] gap-y-[var(--space-7)]">
                {pieces.map((piece, i) => (
                  <PieceCard key={piece.id} piece={piece} withActions priority={i === 0} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title={`Nada de “${query}” en el taller por ahora.`}
              note="Buscamos por nombre, material y descripción. Prueba con una palabra del oficio: roble, tule, latón, acero."
              action={
                <Link href="/categoria/muebles" className="btn-secondary text-sm">
                  Recorrer el catálogo
                </Link>
              }
            />
          )
        ) : (
          <p className="text-[var(--ink-soft)] max-w-lg leading-relaxed">
            Escribe el nombre de una pieza o un material y te mostramos lo que
            hay en taller.
          </p>
        )}
      </div>
    </PageFade>
  );
}
