'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addToCartAction, type CartActionState } from '@/lib/cart/actions';
import { lineTotal, orderTotal, formatMXN } from '@/lib/money';
import type { CatalogPiece, CatalogVariant } from '@/lib/catalog/types';
import LuxuryImage from './LuxuryImage';
import { waLink } from '@/lib/whatsapp';

/**
 * Agregado rápido (§8): foto real, color, cantidad, precio y envío estimado.
 * Confirmar escribe cart_items y muestra el mini-estado del carrito.
 */
export default function QuickAdd({
  piece,
  onClose,
}: {
  piece: CatalogPiece;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(() => {
    const withStock = piece.variants.find((v) => v.stock > 0);
    return withStock?.id ?? piece.variants[0]?.id ?? '';
  });
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<CartActionState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();

  const variant: CatalogVariant | undefined = useMemo(
    () => piece.variants.find((v) => v.id === variantId),
    [piece.variants, variantId]
  );

  const media = variant?.media[0];
  const unit = variant?.priceCents ?? piece.priceCents;
  const line = lineTotal(unit, Math.min(qty, variant?.stock ?? 1));
  const shipping = orderTotal(line, undefined, 'Michoacán').shippingCents;
  const out = !variant || variant.stock <= 0;

  function submit() {
    if (!variant || out) return;
    startTransition(async () => {
      const result = await addToCartAction(variant.id, qty);
      setState(result);
      if (result.status === 'ok') router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="flex gap-[var(--space-4)]">
        {media ? (
          <LuxuryImage
            src={media.path}
            productSlug={piece.slug}
            colorName={variant?.color.name}
            alt={media.alt || piece.name}
            className="w-24 h-30 object-cover rounded-[var(--radius-m)] bg-[var(--paper-2)] border border-[var(--line)]"
          />
        ) : null}
        <div className="flex-1">
          <p className="text-catalog mb-1">{piece.sku}</p>
          <Link
            href={`/producto/${piece.slug}`}
            className="font-display text-lg leading-tight hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            {piece.name}
          </Link>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            {variant?.material ?? piece.materials[0]}
          </p>
          <p className="mt-1 font-mono text-sm font-semibold">{formatMXN(unit)}</p>
        </div>
      </div>

      {/* Color */}
      <fieldset>
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
              } ${v.stock <= 0 ? 'opacity-50' : ''}`}
            >
              <span
                aria-hidden
                className="w-3 h-3 rounded-[2px] border border-[var(--line)]"
                style={{ backgroundColor: v.color.hex }}
              />
              {v.color.name}
              {v.stock <= 0 ? ' · agotado' : ''}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Cantidad */}
      {!out ? (
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
            Cantidad
          </span>
          <div className="flex items-center border border-[var(--line)] rounded-[var(--radius-s)] font-mono text-sm">
            <button
              type="button"
              aria-label="Quitar una pieza"
              className="px-3 py-1 hover:bg-[var(--paper-2)]"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              −
            </button>
            <span aria-live="polite" className="px-3 tabular-nums" data-testid="quickadd-qty">
              {Math.min(qty, variant?.stock ?? 1)}
            </span>
            <button
              type="button"
              aria-label="Agregar una pieza"
              className="px-3 py-1 hover:bg-[var(--paper-2)]"
              onClick={() => setQty((q) => Math.min(variant?.stock ?? 1, q + 1))}
              disabled={qty >= (variant?.stock ?? 1)}
            >
              +
            </button>
          </div>
        </div>
      ) : null}

      {/* Totales */}
      <dl className="border-t border-[var(--line)] pt-[var(--space-3)] font-mono text-xs space-y-1">
        <div className="flex justify-between">
          <dt className="text-[var(--ink-soft)]">Piezas</dt>
          <dd>{formatMXN(line)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--ink-soft)]">Envío estimado</dt>
          <dd>{shipping === 0 ? 'Gratis' : formatMXN(shipping)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-sm pt-1 border-t border-[var(--line)]">
          <dt>Total estimado</dt>
          <dd>{formatMXN(line + shipping)}</dd>
        </div>
      </dl>

      {/* Acciones */}
      {out ? (
        <a
          href={waLink(
            `Hola NOMAHOME. Me interesa la pieza ${piece.name} (${piece.sku}) y quiero saber cuándo hay en taller.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-center"
        >
          Avisar al taller
        </a>
      ) : (
        <button type="button" className="btn-primary" onClick={submit} disabled={pending}>
          {pending ? 'Agregando…' : 'Agregar al carrito'}
        </button>
      )}

      <p aria-live="polite" className="min-h-5 text-xs">
        {state.status === 'ok' ? (
          <span className="text-[var(--ok)]">
            En el carrito.{' '}
            <Link
              href="/carrito"
              className="underline underline-offset-4 decoration-[var(--brass)]"
              onClick={onClose}
            >
              Ver el carrito ({state.cartCount})
            </Link>
          </span>
        ) : null}
        {state.status === 'error' ? (
          <span className="text-[var(--danger)]">{state.message}</span>
        ) : null}
      </p>
    </div>
  );
}
