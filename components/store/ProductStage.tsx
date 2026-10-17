'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { addToCartAction, type CartActionState } from '@/lib/cart/actions';
import { formatMXN, lineTotal, splitIva } from '@/lib/money';
import type { CatalogPiece } from '@/lib/catalog/types';
import { PRODUCT_LUXURY_META } from '@/lib/catalog/photo-registry';
import LuxuryImage from './LuxuryImage';
import { waLink } from '@/lib/whatsapp';

/**
 * Ficha interactiva de lujo (§5, §8):
 * - Galería multi-ángulo (01 Fotografía Editorial, 02 Ficha de Estudio,
 *   03 Escala en Arquitectura) con crossfade de 480 ms al cambiar color.
 * - Swatches con nombre y hex, precio con IVA desglosado, stock real del
 *   taller, medidas arquitectónicas, especificaciones de oficio y carrito.
 */
export default function ProductStage({
  piece,
  favorited = false,
}: {
  piece: CatalogPiece;
  favorited?: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [variantId, setVariantId] = useState(() => {
    const withStock = piece.variants.find((v) => v.stock > 0);
    return withStock?.id ?? piece.variants[0]?.id ?? '';
  });
  const [angleIdx, setAngleIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<CartActionState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(favorited);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [savedPending, startSaved] = useTransition();

  function toggleSaved() {
    startSaved(async () => {
      const { toggleFavoriteAction } = await import('@/lib/account/actions');
      const result = await toggleFavoriteAction(piece.id);
      if (result.ok) {
        setSaved(result.favorited);
        setSavedNote(null);
        router.refresh();
      } else {
        setSavedNote(result.error);
      }
    });
  }

  const variant = piece.variants.find((v) => v.id === variantId) ?? piece.variants[0];
  const out = !variant || variant.stock <= 0;
  const unit = variant?.priceCents ?? piece.priceCents;
  const maxQty = variant?.stock ?? 1;
  const safeQty = Math.min(qty, maxQty);
  const iva = splitIva(unit);
  const meta = PRODUCT_LUXURY_META[piece.slug];

  const angleLabels = ['01 · Fotografía real', '02 · Ficha de estudio', '03 · En espacio'];

  function add() {
    if (!variant || out) return;
    startTransition(async () => {
      const result = await addToCartAction(variant.id, safeQty);
      setState(result);
      if (result.status === 'ok') router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
      {/* Galería principal + miniaturas de ángulo */}
      <div className="col-span-12 md:col-span-7 flex flex-col gap-[var(--space-4)]">
        <div className="relative aspect-[4/5] w-full bg-[var(--paper-2)] rounded-[var(--radius-m)] overflow-hidden border border-[var(--line)]">
          {piece.variants.map((v) => {
            const mediaList = v.media.length > 0 ? v.media : [];
            const activeMedia = mediaList[angleIdx] ?? mediaList[0];
            const isActiveVariant = v.id === variantId;

            return (
              <motion.div
                key={`${v.id}-${angleIdx}`}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isActiveVariant ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={!isActiveVariant}
              >
                {activeMedia ? (
                  <LuxuryImage
                    src={activeMedia.path}
                    productSlug={angleIdx === 0 ? piece.slug : undefined}
                    colorName={v.color.name}
                    alt={activeMedia.alt || `${piece.name} en ${v.color.name}`}
                    priority={isActiveVariant}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </motion.div>
            );
          })}

          {/* Placa flotante de origen y medidas */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
            <span className="bg-[#1c1712]/85 text-[#f3eee6] backdrop-blur-sm px-3 py-1 rounded-[var(--radius-s)] font-mono text-[11px] uppercase tracking-[0.08em]">
              {meta?.origin ?? 'Taller Morelia'}
            </span>
            <span className="bg-[#f3eee6]/92 text-[#1c1712] backdrop-blur-sm px-3 py-1 rounded-[var(--radius-s)] font-mono text-[11px] uppercase tracking-[0.08em] border border-[var(--line)]">
              {variant?.sku ?? piece.sku}
            </span>
          </div>
        </div>

        {/* Selector de vistas de la galería */}
        {variant && variant.media.length > 1 ? (
          <div
            className="grid grid-cols-3 gap-[var(--space-3)]"
            role="group"
            aria-label="Vistas de la pieza"
          >
            {variant.media.slice(0, 3).map((m, idx) => {
              const active = idx === angleIdx;
              return (
                <button
                  key={`${m.path}-${idx}`}
                  type="button"
                  onClick={() => setAngleIdx(idx)}
                  aria-pressed={active}
                  className={`group/thumb text-left rounded-[var(--radius-m)] overflow-hidden border transition-all ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                      : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
                  }`}
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--paper-2)]">
                    <LuxuryImage
                      src={m.path}
                      productSlug={idx === 0 ? piece.slug : undefined}
                      colorName={variant.color.name}
                      alt={m.alt || `${piece.name} vista ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                    />
                  </div>
                  <p className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em]">
                    {angleLabels[idx] ?? `0${idx + 1} · Vista`}
                  </p>
                </button>
              );
            })}
          </div>
        ) : null}

        {piece.videoUrl ? (
          <a
            href={piece.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-catalog inline-block underline underline-offset-4 decoration-[var(--brass)]"
          >
            Ver la pieza en video
          </a>
        ) : null}
      </div>

      {/* Columna de especificación y compra */}
      <div className="col-span-12 md:col-span-5 flex flex-col gap-[var(--space-4)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-catalog">{piece.sku}</p>
          {meta?.badge ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--brass)]">
              {meta.badge}
            </span>
          ) : null}
        </div>

        <h1 className="font-display font-semibold text-3xl md:text-5xl leading-[0.98] tracking-[-0.02em]">
          {piece.name}
        </h1>

        {piece.summary ? (
          <p className="text-[var(--ink-soft)] leading-relaxed">{piece.summary}</p>
        ) : null}

        {/* Swatches: nombre y hex visibles (§8) */}
        <fieldset className="pt-[var(--space-2)]">
          <legend className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-2)]">
            Color de taller
          </legend>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {piece.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === variantId}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                  setState({ status: 'idle' });
                }}
                className={`flex items-center gap-2 border px-[var(--space-3)] py-1.5 rounded-[var(--radius-s)] text-xs transition-colors ${
                  v.id === variantId
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                    : 'border-[var(--line)] hover:border-[var(--ink-soft)]'
                }`}
              >
                <span
                  aria-hidden
                  className="w-3.5 h-3.5 rounded-[2px] border border-[var(--line)]"
                  style={{ backgroundColor: v.color.hex }}
                />
                {v.color.name}
                <span
                  className={
                    v.id === variantId ? 'text-[var(--brass-2)]' : 'text-[var(--ink-soft)]'
                  }
                >
                  {v.color.hex}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Precio + IVA */}
        <div className="flex flex-col gap-1 pt-[var(--space-3)] border-t border-[var(--line)]">
          <div className="flex items-baseline gap-[var(--space-3)]">
            {variant?.compareAtCents && variant.compareAtCents > unit ? (
              <s className="font-mono text-sm text-[var(--ink-soft)]">
                {formatMXN(variant.compareAtCents)}
              </s>
            ) : null}
            <span className="font-mono text-2xl md:text-3xl font-semibold" data-testid="price">
              {formatMXN(unit)}
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
            IVA incluido {formatMXN(iva.taxCents)} ·{' '}
            {out ? 'Sin piezas en taller' : `${variant?.stock} en taller`}
          </p>
        </div>

        {/* Medidas de la variante */}
        {variant ? (
          <dl className="grid grid-cols-2 gap-x-[var(--space-4)] gap-y-[var(--space-3)] p-[var(--space-4)] rounded-[var(--radius-m)] bg-[var(--paper-2)] border border-[var(--line)] font-mono text-xs text-[var(--ink-soft)]">
            <div>
              <dt className="uppercase tracking-[0.08em] text-[10px]">Medidas (L × P × A)</dt>
              <dd className="text-[var(--ink)] font-semibold mt-0.5">
                {variant.dimensions.widthCm} × {variant.dimensions.depthCm} ×{' '}
                {variant.dimensions.heightCm} cm
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.08em] text-[10px]">Peso en obra</dt>
              <dd className="text-[var(--ink)] font-semibold mt-0.5">
                {variant.dimensions.weightKg} kg
              </dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-[var(--line)]">
              <dt className="uppercase tracking-[0.08em] text-[10px]">Materia principal</dt>
              <dd className="text-[var(--ink)] font-semibold mt-0.5">{variant.material}</dd>
            </div>
          </dl>
        ) : null}

        {/* Atributos de lujo y factura */}
        {meta ? (
          <ul className="space-y-1.5 text-xs text-[var(--ink-soft)] border-l-2 border-[var(--brass)] pl-3">
            {meta.highlights.map((h) => (
              <li key={h}>· {h}</li>
            ))}
          </ul>
        ) : null}

        {/* Cantidad + acciones */}
        {out ? (
          <>
            <p className="text-sm text-[var(--ink-soft)]">
              Ese color se acabó. La madera tarda, la respuesta no.
            </p>
            <a
              href={waLink(
                `Hola NOMAHOME. Me interesa la pieza ${piece.name} (${piece.sku}) en ${variant?.color.name ?? 'algunos colores'}. ¿Cuándo hay en taller?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center"
            >
              Avisar al taller
            </a>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                Cantidad
              </span>
              <div className="flex items-center border border-[var(--line)] rounded-[var(--radius-s)] font-mono text-sm bg-[var(--paper)]">
                <button
                  type="button"
                  aria-label="Quitar una pieza"
                  className="px-3 py-1 hover:bg-[var(--paper-2)]"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={safeQty <= 1}
                >
                  −
                </button>
                <span aria-live="polite" className="px-3 tabular-nums">
                  {safeQty}
                </span>
                <button
                  type="button"
                  aria-label="Agregar una pieza"
                  className="px-3 py-1 hover:bg-[var(--paper-2)]"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={safeQty >= maxQty}
                >
                  +
                </button>
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={add} disabled={pending}>
              {pending
                ? 'Agregando…'
                : `Agregar al carrito · ${formatMXN(lineTotal(unit, safeQty))}`}
            </button>
          </>
        )}

        <div className="flex flex-wrap items-center gap-[var(--space-4)]">
          <Link
            href={`/producto/${piece.slug}/agregar`}
            className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]"
          >
            Elegir rápido
          </Link>
          <button
            type="button"
            onClick={toggleSaved}
            disabled={savedPending}
            className={`font-mono text-sm underline underline-offset-4 decoration-[var(--brass)] ${
              saved ? 'text-[var(--brass)]' : ''
            }`}
            aria-pressed={saved}
          >
            {saved ? 'Guardada' : 'Guardar pieza'}
          </button>
        </div>

        <p aria-live="polite" className="min-h-5 text-xs">
          {savedNote ? <span className="text-[var(--danger)]">{savedNote}</span> : null}
        </p>

        <p aria-live="polite" className="min-h-5 text-xs">
          {state.status === 'ok' ? (
            <span className="text-[var(--ok)]">
              En el carrito ·{' '}
              <Link
                href="/carrito"
                className="underline underline-offset-4 decoration-[var(--brass)]"
              >
                verlo ({state.cartCount})
              </Link>
            </span>
          ) : null}
          {state.status === 'error' ? (
            <span className="text-[var(--danger)]">{state.message}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
