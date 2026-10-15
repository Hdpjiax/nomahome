'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { createOrderAction, type CheckoutState } from '@/lib/checkout/actions';
import { formatMXN, orderTotal, shippingCents } from '@/lib/money';
import type { CartView } from '@/lib/cart/service';

export type SavedAddress = {
  id: string;
  recipient: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
};

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';

const label = 'block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]';

/**
 * Checkout en una sola página (§8): datos, dirección mexicana, resumen con
 * envío recalculado según estado y cobro por SPEI. Al confirmar, el
 * servidor recalcula todo y crea el pedido pending_payment.
 */
export default function CheckoutForm({
  cart,
  user,
  addresses,
  clabe,
  bank,
}: {
  cart: CartView;
  user: { email: string; name: string } | null;
  addresses: SavedAddress[];
  clabe: string;
  bank: string;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState | null, FormData>(
    createOrderAction,
    null
  );
  const errs = state?.status === 'error' ? state.fieldErrors : undefined;
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>(
    addresses.length > 0 ? 'saved' : 'new'
  );
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? ''
  );
  const [stateMX, setStateMX] = useState(addresses[0]?.state ?? 'Michoacán');

  const totals = useMemo(
    () => orderTotal(cart.subtotalCents, undefined, stateMX),
    [cart.subtotalCents, stateMX]
  );
  const shipping = shippingCents(cart.subtotalCents, stateMX);

  return (
    <form action={formAction} className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-7)]" noValidate>
      {/* Columna izquierda: datos + dirección */}
      <div className="col-span-12 md:col-span-7 flex flex-col gap-[var(--space-7)]">
        <section aria-labelledby="ck-datos">
          <h2 id="ck-datos" className="font-display text-2xl mb-[var(--space-4)]">
            1. Tus datos
          </h2>
          {user ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Compras como <strong className="text-[var(--ink)]">{user.email}</strong>
              {user.name ? ` (${user.name})` : ''}. El recibo llega a ese correo.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-[var(--space-4)]">
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="name" className={label}>Nombre</label>
                <input id="name" name="name" className={field} autoComplete="name" required />
                {errs?.name ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.name}</p>
                ) : null}
              </div>
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="email" className={label}>Correo</label>
                <input id="email" name="email" type="email" className={field} autoComplete="email" required />
                {errs?.email ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.email}</p>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="ck-direccion">
          <h2 id="ck-direccion" className="font-display text-2xl mb-[var(--space-4)]">
            2. Dirección de envío
          </h2>

          {addresses.length > 0 ? (
            <div className="mb-[var(--space-4)]">
              {addresses.map((a) => (
                <label key={a.id} className="flex items-start gap-[var(--space-3)] py-[var(--space-2)] text-sm">
                  <input
                    type="radio"
                    name="addressMode"
                    value="saved"
                    checked={addressMode === 'saved' && addressId === a.id}
                    onChange={() => {
                      setAddressMode('saved');
                      setAddressId(a.id);
                      setStateMX(a.state);
                    }}
                    className="mt-1 accent-[var(--brass)]"
                  />
                  <span>
                    <strong>{a.recipient}</strong> — {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} · C.P. {a.postal_code}
                    {a.is_default ? ' (predeterminada)' : ''}
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-[var(--space-3)] py-[var(--space-2)] text-sm">
                <input
                  type="radio"
                  name="addressMode"
                  value="new"
                  checked={addressMode === 'new'}
                  onChange={() => setAddressMode('new')}
                  className="accent-[var(--brass)]"
                />
                Usar otra dirección
              </label>
              {addressMode === 'saved' ? <input type="hidden" name="addressId" value={addressId} /> : null}
            </div>
          ) : null}

          {addressMode === 'new' ? (
            <div className="grid grid-cols-2 gap-[var(--space-4)]">
              <div className="col-span-2">
                <label htmlFor="recipient" className={label}>¿A quién se entrega?</label>
                <input id="recipient" name="recipient" className={field} autoComplete="shipping name" required />
                {errs?.recipient ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.recipient}</p>
                ) : null}
              </div>
              <div className="col-span-2">
                <label htmlFor="line1" className={label}>Calle y número</label>
                <input id="line1" name="line1" className={field} autoComplete="shipping address-line1" required />
                {errs?.line1 ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.line1}</p>
                ) : null}
              </div>
              <div className="col-span-2">
                <label htmlFor="line2" className={label}>Interior, referencias (opcional)</label>
                <input id="line2" name="line2" className={field} autoComplete="shipping address-line2" />
              </div>
              <div>
                <label htmlFor="city" className={label}>Ciudad</label>
                <input
                  id="city"
                  name="city"
                  className={field}
                  autoComplete="shipping address-level2"
                  onChange={(e) => e.target.value && setStateMX(e.target.value)}
                  required
                />
                {errs?.city ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.city}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="state" className={label}>Estado</label>
                <input
                  id="state"
                  name="state"
                  className={field}
                  autoComplete="shipping address-level1"
                  defaultValue="Michoacán"
                  onChange={(e) => setStateMX(e.target.value)}
                  required
                />
                {errs?.state ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.state}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="postalCode" className={label}>Código postal</label>
                <input id="postalCode" name="postalCode" className={field} inputMode="numeric" maxLength={5} required />
                {errs?.postalCode ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.postalCode}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="phone" className={label}>Teléfono</label>
                <input id="phone" name="phone" className={field} inputMode="tel" autoComplete="shipping tel" required />
                {errs?.phone ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">{errs?.phone}</p>
                ) : null}
              </div>
              {user ? (
                <label className="col-span-2 flex items-center gap-[var(--space-2)] text-sm">
                  <input type="checkbox" name="saveAddress" className="w-4 h-4 accent-[var(--brass)]" />
                  Guardar esta dirección en mi cuenta
                </label>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {/* Columna derecha: resumen + cobro */}
      <aside className="col-span-12 md:col-span-5 md:border-l md:border-[var(--line)] md:pl-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
        <section aria-labelledby="ck-resumen">
          <h2 id="ck-resumen" className="font-display text-2xl mb-[var(--space-4)]">
            3. Tu pedido
          </h2>
          <ul className="divide-y divide-[var(--line)] mb-[var(--space-4)]">
            {cart.lines.map((l) => (
              <li key={l.itemId} className="py-[var(--space-2)] flex justify-between gap-[var(--space-3)] text-sm">
                <span>
                  {l.qty} × {l.productName}
                  <span className="block text-xs text-[var(--ink-soft)]">{l.colorName} · {l.variantSku}</span>
                </span>
                <span className="font-mono">{formatMXN(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="font-mono text-sm space-y-[var(--space-2)]">
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Subtotal</dt>
              <dd>{formatMXN(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Envío ({stateMX})</dt>
              <dd>{shipping === 0 ? 'Gratis' : formatMXN(shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">IVA incluido</dt>
              <dd>{formatMXN(totals.taxCents)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold pt-[var(--space-2)] border-t border-[var(--line)]">
              <dt>Total a transferir</dt>
              <dd>{formatMXN(totals.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="ck-cobro" className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-5)]">
          <h2 id="ck-cobro" className="font-display text-2xl mb-[var(--space-3)]">
            4. Cobro por SPEI
          </h2>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-[var(--space-4)]">
            Al confirmar te damos la referencia exacta de tu pedido. Transfiere
            desde tu banco y el taller confirma al verla. Tu tarjeta nunca
            pasa por este sitio: no la pedimos.
          </p>
          {clabe ? (
            <dl className="font-mono text-xs space-y-1 bg-[var(--paper-2)] rounded-[var(--radius-s)] p-[var(--space-3)]">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--ink-soft)]">CLABE del taller</dt>
                <dd className="tabular-nums">{clabe}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--ink-soft)]">Banco</dt>
                <dd>{bank || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--ink-soft)]">Concepto</dt>
                <dd>Tu referencia (se genera al confirmar)</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-[var(--danger)] leading-relaxed">
              Falta configurar la CLABE del taller (NEXT_PUBLIC_STORE_CLABE).
              El pedido se puede crear; el cobro se habilita con la CLABE.
            </p>
          )}
        </section>

        <p aria-live="polite" className="min-h-5 text-xs">
          {state?.status === 'error' ? (
            <span className="text-[var(--danger)]">{state.message}</span>
          ) : null}
        </p>

        <button type="submit" className="btn-primary text-center" disabled={pending}>
          {pending ? 'Creando tu pedido…' : 'Crear pedido y transferir'}
        </button>

        <Link
          href="/carrito"
          className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
        >
          ← Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
