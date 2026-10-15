import { formatMXN, splitIva } from '@/lib/money';

type PriceTagProps = {
  priceCents: number;
  compareAtCents?: number | null;
  size?: 'sm' | 'base' | 'lg';
  /** Muestra el IVA contenido — el precio de vitrina ya lo incluye. */
  withIva?: boolean;
  className?: string;
};

/**
 * Precio de vitrina. Los precios salen de lib/money y el IVA se informa
 * como incluido (INSTRUCCION.md §5): jamás se suma encima.
 */
export default function PriceTag({
  priceCents,
  compareAtCents,
  size = 'base',
  withIva = false,
  className = '',
}: PriceTagProps) {
  const { taxCents } = splitIva(priceCents);
  const sizeClass =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className={`flex items-baseline gap-[var(--space-3)] ${className}`}>
      {compareAtCents && compareAtCents > priceCents ? (
        <s className="font-mono text-sm text-[var(--ink-soft)]">
          {formatMXN(compareAtCents)}
        </s>
      ) : null}
      <span
        className={`font-mono font-semibold tracking-[0.02em] ${sizeClass}`}
        data-testid="price"
      >
        {formatMXN(priceCents)}
      </span>
      {withIva ? (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
          IVA incluido {formatMXN(taxCents)}
        </span>
      ) : null}
    </div>
  );
}
