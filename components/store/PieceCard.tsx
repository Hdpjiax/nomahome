'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import PriceTag from './PriceTag';
import QuickAddSheet from './QuickAddSheet';
import LuxuryImage from './LuxuryImage';
import { PRODUCT_LUXURY_META } from '@/lib/catalog/photo-registry';
import type { CatalogPiece } from '@/lib/catalog/types';

type PieceCardProps = {
  piece: CatalogPiece;
  withActions?: boolean;
  priority?: boolean;
  featured?: boolean;
};

/**
 * Celda editorial cálida y orgánica (Lumen Editorial Luxury):
 * - Fotografía real bañada en luz cálida sin marcos técnicos robóticos.
 * - Subtítulo de materia en cursiva serif (Fraunces italic).
 * - Medallones táctiles de acabado que cambian la fotografía en vivo.
 * - Botones de ebanistería con filete de latón cepillado.
 */
export default function PieceCard({
  piece,
  withActions = true,
  priority = false,
  featured = false,
}: PieceCardProps) {
  const reduce = useReducedMotion();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeVariant = piece.variants[selectedIdx] ?? piece.variants[0];
  const meta = PRODUCT_LUXURY_META[piece.slug];
  const dims = activeVariant?.dimensions;
  const dimText =
    dims?.widthCm && dims?.depthCm && dims?.heightCm
      ? `${dims.widthCm} × ${dims.depthCm} × ${dims.heightCm} cm`
      : null;

  return (
    <article className="group flex flex-col h-full">
      {/* Fotografía limpia y cálida con sombra orgánica suave */}
      <div className="relative overflow-hidden rounded-[var(--radius-m)] bg-[var(--paper-2)] shadow-[0_24px_54px_-18px_rgba(42,30,18,0.16)] transition-all duration-[520ms] ease-[var(--ease)] group-hover:shadow-[0_32px_68px_-16px_rgba(42,30,18,0.24)]">
        <Link
          href={`/producto/${piece.slug}`}
          className="block relative aspect-[4/5] w-full overflow-hidden"
          aria-label={`Ver pieza ${piece.name}`}
        >
          {piece.variants.map((v, idx) => {
            const vMedia = v.media[0];
            const isCurrent = idx === selectedIdx;
            return (
              <motion.div
                key={v.id}
                initial={false}
                animate={{ opacity: isCurrent ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
                aria-hidden={!isCurrent}
              >
                {vMedia ? (
                  <LuxuryImage
                    src={vMedia.path}
                    productSlug={piece.slug}
                    colorName={v.color.name}
                    alt={vMedia.alt || `${piece.name} en ${v.color.name}`}
                    priority={priority && isCurrent}
                    className="h-full w-full object-cover transition-transform duration-[700ms] ease-[var(--ease)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="h-full w-full bg-[var(--paper-2)]" />
                )}
              </motion.div>
            );
          })}

          {/* Etiqueta sutil y cálida en vidrio esmerilado */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
            <span className="bg-[#f6f1e8]/88 text-[#2b221a] backdrop-blur-md px-3 py-1 rounded-[var(--radius-s)] font-display italic text-xs border border-[#8d6840]/25">
              {meta?.badge ?? piece.categories[0]?.name ?? 'Colección de Taller'}
            </span>
            {dimText ? (
              <span className="bg-[#1c1712]/72 text-[#f3eee6] backdrop-blur-md px-2.5 py-1 rounded-[var(--radius-s)] font-mono text-[10px] tracking-[0.06em]">
                {dimText}
              </span>
            ) : null}
          </div>
        </Link>
      </div>

      {/* Pie editorial cálido */}
      <div className="pt-[var(--space-4)] flex-1 flex flex-col justify-between gap-[var(--space-3)]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-catalog">{piece.sku}</p>
            <span className="font-display italic text-xs text-[var(--ink-soft)]">
              {activeVariant && activeVariant.stock > 0
                ? `${activeVariant.stock} piezas en taller`
                : 'Hecho bajo pedido'}
            </span>
          </div>

          <Link href={`/producto/${piece.slug}`} className="w-fit group/title">
            <h3
              className={`font-display ${
                featured ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
              } leading-tight group-hover/title:text-[var(--brass)] transition-colors`}
            >
              {piece.name}
            </h3>
          </Link>

          {activeVariant ? (
            <p className="font-display italic text-sm text-[var(--ink-soft)]">
              *{activeVariant.material}*
            </p>
          ) : null}

          {piece.summary ? (
            <p className="text-xs text-[var(--ink-soft)]/90 leading-relaxed line-clamp-2 mt-0.5">
              {piece.summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-[var(--space-3)] pt-[var(--space-3)] border-t border-[#8d6840]/20">
          {/* Medallones táctiles de materia + Precio */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PriceTag
              priceCents={activeVariant?.priceCents ?? piece.priceCents}
              compareAtCents={activeVariant?.compareAtCents ?? piece.compareAtCents}
            />

            <div
              className="flex items-center gap-1.5"
              role="group"
              aria-label={`Acabados para ${piece.name}`}
            >
              {piece.variants.map((v, idx) => {
                const active = idx === selectedIdx;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    aria-label={`Acabado ${v.color.name}`}
                    aria-pressed={active}
                    title={`${v.color.name}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] border text-xs transition-all ${
                      active
                        ? 'border-[var(--brass)] bg-[#231c16] text-[var(--paper)] shadow-sm'
                        : 'border-[#8d6840]/30 bg-[#f8f4ec] text-[var(--ink-soft)] hover:border-[var(--brass)]'
                    }`}
                  >
                    <span
                      aria-hidden
                      className="w-3 h-3 rounded-[2px] border border-black/20 shadow-inner"
                      style={{ backgroundColor: v.color.hex }}
                    />
                    <span className="font-display italic text-xs">{v.color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {withActions ? (
            <div className="flex items-center gap-[var(--space-3)] pt-1">
              <Link
                href={`/producto/${piece.slug}`}
                className="btn-primary text-sm flex-1 text-center"
              >
                <span>Ver pieza</span>
                <span aria-hidden className="text-[var(--brass-2)]">
                  →
                </span>
              </Link>
              <QuickAddSheet piece={piece} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
