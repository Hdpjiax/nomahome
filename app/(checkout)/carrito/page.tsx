import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCartView } from '@/lib/cart/service';
import { removeItemFormAction, setItemQtyFormAction } from '@/lib/cart/actions';
import EmptyState from '@/components/store/EmptyState';
import PageFade from '@/components/motion/PageFade';
import { formatMXN } from '@/lib/money';
import { waLink, waOrder } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Carrito — NOMAHOME',
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await getCartView();

  if (!cart || cart.lines.length === 0) {
    return (
      <PageFade>
        <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
          <p className="text-catalog mb-[var(--space-3)]">Carrito</p>
          <EmptyState
            title="Tu carrito está en silencio."
            note="Cuando agregues una pieza, aparece aquí con su foto, su color y la medida del paquete."
            action={
              <Link href="/categoria/muebles" className="btn-primary text-sm">
                Recorrer el catálogo
              </Link>
            }
          />
        </div>
      </PageFade>
    );
  }

  const waMessage = waOrder({
    lines: cart.lines.map((l) => ({
      sku: l.variantSku,
      color: l.colorName,
      qty: l.qty,
    })),
    total: formatMXN(cart.totalCents),
  });

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">Carrito</p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
            {cart.itemCount} {cart.itemCount === 1 ? 'pieza' : 'piezas'} listas.
          </h1>
        </header>

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
          {/* Líneas */}
          <section aria-label="Piezas del carrito" className="col-span-12 md:col-span-8">
            <ul className="divide-y divide-[var(--line)]">
              {cart.lines.map((line) => {
                const setQty = setItemQtyFormAction.bind(null, line.itemId, line.qty - 1);
                const addQty = setItemQtyFormAction.bind(null, line.itemId, line.qty + 1);
                const remove = removeItemFormAction.bind(null, line.itemId);
                const atStock = line.qty >= line.stock;

                return (
                  <li key={line.itemId} className="py-[var(--space-5)] flex gap-[var(--space-4)]">
                    <Link href={`/producto/${line.productSlug}`} className="shrink-0">
                      {line.mediaPath ? (
                        <Image
                          src={line.mediaPath}
                          alt={line.mediaAlt ?? line.productName}
                          width={120}
                          height={150}
                          className="w-20 h-25 object-cover rounded-[var(--radius-m)] bg-[var(--paper-2)]"
                        />
                      ) : (
                        <div className="w-20 h-25 rounded-[var(--radius-m)] bg-[var(--paper-2)]" />
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col gap-[var(--space-2)]">
                      <div>
                        <p className="text-catalog">{line.variantSku}</p>
                        <Link href={`/producto/${line.productSlug}`}>
                          <h2 className="font-display text-lg leading-tight hover:underline underline-offset-4 decoration-[var(--brass)]">
                            {line.productName}
                          </h2>
                        </Link>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {line.colorName} · {line.material}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
                        <div className="flex items-center gap-[var(--space-3)]">
                          <div className="flex items-center border border-[var(--line)] rounded-[var(--radius-s)] font-mono text-sm">
                            <form action={setQty}>
                              <button
                                type="submit"
                                aria-label={`Quitar una ${line.productName}`}
                                className="px-2 py-1 hover:bg-[var(--paper-2)]"
                                disabled={line.qty <= 1}
                              >
                                −
                              </button>
                            </form>
                            <span className="px-2 tabular-nums" aria-live="polite">
                              {line.qty}
                            </span>
                            <form action={addQty}>
                              <button
                                type="submit"
                                aria-label={`Agregar una ${line.productName}`}
                                className="px-2 py-1 hover:bg-[var(--paper-2)]"
                                disabled={atStock}
                                title={atStock ? `Solo hay ${line.stock} en taller` : undefined}
                              >
                                +
                              </button>
                            </form>
                          </div>
                          <form action={remove}>
                            <button type="submit" className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]">
                              Quitar
                            </button>
                          </form>
                        </div>

                        <div className="text-right">
                          <p className="font-mono text-sm">
                            {formatMXN(line.unitPriceCents)} c/u
                          </p>
                          <p className="font-mono text-sm font-semibold">
                            {formatMXN(line.lineTotalCents)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Resumen */}
          <aside
            aria-label="Resumen del pedido"
            className="col-span-12 md:col-span-4 border-t md:border-t-0 md:border-l border-[var(--line)] md:pl-[var(--space-6)]"
          >
            <div className="pt-[var(--space-5)] md:pt-0 flex flex-col gap-[var(--space-4)]">
              <dl className="font-mono text-sm space-y-[var(--space-2)]">
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">Subtotal</dt>
                  <dd>{formatMXN(cart.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">Envío estimado</dt>
                  <dd>{cart.shippingCents === 0 ? 'Gratis' : formatMXN(cart.shippingCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--ink-soft)]">IVA incluido</dt>
                  <dd>{formatMXN(cart.taxCents)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold pt-[var(--space-2)] border-t border-[var(--line)]">
                  <dt>Total</dt>
                  <dd>{formatMXN(cart.totalCents)}</dd>
                </div>
              </dl>

              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                {cart.shippingNote} El IVA ya está en el precio: no se suma al final.
              </p>

              <Link href="/checkout" className="btn-primary text-center">
                Continuar al pago
              </Link>

              <a
                href={waLink(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]"
              >
                Hablar del pedido por WhatsApp
              </a>

              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Puedes seguir como invitado: te pedimos tu correo al pagar.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageFade>
  );
}
