'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { addToCartAction, type CartActionState } from '@/lib/cart/actions';
import { formatMXN, lineTotal, splitIva } from '@/lib/money';
import type { CatalogPiece } from '@/lib/catalog/types';
import { waLink } from '@/lib/whatsapp';

/**
 * Ficha interactiva (§5, §8): galería apilada con crossfade de 480 ms al
 * cambiar color, swatches con nombre y hex, precio con IVA informado,
 * stock real del taller, medidas, cantidad, carrito o aviso por WhatsApp.
 * Sin stock 0 no hay checkout (§8): botón Avisar al taller.
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

  function add() {
    if (!variant || out) return;
    startTransition(async () => {
      const result = await addToCartAction(variant.id, safeQty);
      setState(result);
      if (result.status === 'ok') router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-5)]">
      {/* Galería: una pila por variante, crossfade 480 ms (§5 motion). */}
      <div className="col-span-12 md:col-span-7">
        <div className="relative aspect-[4/5] w-full bg-[var(--paper-2)] rounded-[var(--radius-m)] overflow-hidden">
          {piece.variants.map((v) => (
            <motion.div
              key={v.id}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: v.id === variantId ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={v.id !== variantId}
            >
              {v.media[0] ? (
                <Image
                  src={v.media[0].path}
                  alt={v.media[0].alt || `${piece.name} en ${v.color.name}`}
                  fill
                  priority={v.id === variantId}
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-cover"
                />
              ) : null}
            </motion.div>
          ))}
        </div>
        {piece.videoUrl ? (
          <a
            href={piece.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-catalog mt-[var(--space-3)] inline-block underline underline-offset-4 decoration-[var(--brass)]"
          >
            Ver la pieza en video
          </a>
        ) : null}
      </div>

      {/* Compra */}
      <div className="col-span-12 md:col-span-5 flex flex-col gap-[var(--space-4)]">
        <p className="text-catalog">{piece.sku}</p>
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
                className={`flex items-center gap-2 border px-[var(--space-2)] py-1 rounded-[var(--radius-s)] text-xs ${
                  v.id === variantId
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                    : 'border-[var(--line)] hover:border-[var(--ink-soft)]'
                }`}
              >
                <span
                  aria-hidden
                  className="w-3 h-3 rounded-[2px] border border-[var(--line)]"
                  style={{ backgroundColor: v.color.hex }}
                />
                {v.color.name}
                <span className={v.id === variantId ? 'text-[var(--brass-2)]' : 'text-[var(--ink-soft)]'}>
                  {v.color.hex}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Precio + IVA */}
        <div className="flex flex-col gap-1 pt-[var(--space-2)] border-t border-[var(--line)]">
          <div className="flex items-baseline gap-[var(--space-3)]">
            {variant?.compareAtCents && variant.compareAtCents > unit ? (
              <s className="font-mono text-sm text-[var(--ink-soft)]">
                {formatMXN(variant.compareAtCents)}
              </s>
            ) : null}
            <span className="font-mono text-2xl font-semibold" data-testid="price">
              {formatMXN(unit)}
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
            IVA incluido {formatMXN(iva.taxCents)} · {out ? 'Sin piezas en taller' : `${variant?.stock} en taller`}
          </p>
        </div>

        {/* Medidas de la variante */}
        {variant ? (
          <dl className="grid grid-cols-2 gap-x-[var(--space-4)] gap-y-[var(--space-2)] font-mono text-xs text-[var(--ink-soft)]">
            <div>
              <dt className="uppercase tracking-[0.08em] text-[10px]">Medidas</dt>
              <dd className="text-[var(--ink)]">
                {variant.dimensions.widthCm} × {variant.dimensions.depthCm} × {variant.dimensions.heightCm} cm
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.08em] text-[10px]">Peso</dt>
              <dd className="text-[var(--ink)]">{variant.dimensions.weightKg} kg</dd>
            </div>
            <div className="col-span-2">
              <dt className="uppercase tracking-[0.08em] text-[10px]">Material</dt>
              <dd className="text-[var(--ink)]">{variant.material}</dd>
            </div>
          </dl>
        ) : null}

        {/* Cantidad + acciones */}
        {out ? (
          <>
            <p className="text-sm text-[var(--ink-soft)]">
              Ese color se acabó. La madera tarda, la respuesta no.
            </p>
            <a
              href={waLink(`Hola NOMAHOME. Me interesa la pieza ${piece.name} (${piece.sku}) en ${variant?.color.name ?? 'algunos colores'}. ¿Cuándo hay en taller?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center"
            >
              Avisar al taller
            </a>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                Cantidad
              </span>
              <div className="flex items-center border border-[var(--line)] rounded-[var(--radius-s)] font-mono text-sm">
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
              {pending ? 'Agregando…' : `Agregar al carrito · ${formatMXN(lineTotal(unit, safeQty))}`}
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
              <Link href="/carrito" className="underline underline-offset-4 decoration-[var(--brass)]">
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
