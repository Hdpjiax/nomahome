import Image from 'next/image';
import Link from 'next/link';
import PriceTag from './PriceTag';
import QuickAddSheet from './QuickAddSheet';
import type { CatalogPiece } from '@/lib/catalog/types';

type PieceCardProps = {
  piece: CatalogPiece;
  /** En listados de categoría, la acción Agregar abre la ruta ligera. */
  withActions?: boolean;
  priority?: boolean;
};

/**
 * La celda de catálogo (Lumen Editorial §5): imagen 4:5, número de pieza,
 * nombre, material y precio. La separación es el papel: sin borde gris,
 * sin sombra de card, sin píldoras. El hover de escritorio escala la
 * imagen 1.03 en 700 ms y nada más.
 */
export default function PieceCard({ piece, withActions = false, priority = false }: PieceCardProps) {
  const firstVariant = piece.variants[0];
  const media = firstVariant?.media[0];

  return (
    <article className="group flex flex-col">
      <Link
        href={`/producto/${piece.slug}`}
        className="block overflow-hidden rounded-[var(--radius-m)] bg-[var(--paper-2)] motion-reduce:transition-none motion-reduce:transform-none"
        aria-label={`Ver pieza ${piece.name}`}
      >
        {media ? (
          <Image
            src={media.path}
            alt={media.alt || piece.name}
            width={media.width ?? 800}
            height={media.height ?? 1000}
            priority={priority}
            className="aspect-[4/5] w-full object-cover transition-transform duration-[700ms] ease-[var(--ease)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          />
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}
      </Link>

      <div className="pt-[var(--space-4)] flex flex-col gap-[var(--space-2)]">
        <p className="text-catalog">{piece.sku}</p>
        <Link href={`/producto/${piece.slug}`} className="w-fit">
          <h3 className="font-display text-xl md:text-2xl leading-tight hover:underline underline-offset-4 decoration-[var(--brass)]">
            {piece.name}
          </h3>
        </Link>
        {firstVariant ? (
          <p className="text-sm text-[var(--ink-soft)]">{firstVariant.material}</p>
        ) : null}
        <PriceTag priceCents={piece.priceCents} compareAtCents={piece.compareAtCents} />
        {piece.colors.length > 1 ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
            {piece.colors.length} colores de taller
          </p>
        ) : null}

        {withActions ? (
          <div className="flex items-center gap-[var(--space-3)] pt-[var(--space-2)]">
            <Link href={`/producto/${piece.slug}`} className="btn-primary text-sm">
              Ver pieza
            </Link>
            <QuickAddSheet piece={piece} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
