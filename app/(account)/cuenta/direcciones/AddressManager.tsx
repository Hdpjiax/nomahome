'use client';

import { useActionState, useState } from 'react';
import { saveAddressAction, deleteAddressAction, type AccountState } from '@/lib/account/actions';

export type Address = {
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

/**
 * Alta y edición de direcciones mexicanas (§8 cuenta). Zod en el servidor;
 * aquí solo recogemos y mostramos lo que responde la acción.
 */
export default function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(addresses.length === 0);
  const [state, formAction, pending] = useActionState<AccountState | null, FormData>(
    saveAddressAction,
    null
  );

  function done() {
    setEditing(null);
    setCreating(false);
  }

  if (!creating && !editing) {
    return (
      <div className="flex flex-col gap-[var(--space-4)]">
        <ul className="grid grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-4)]">
          {addresses.map((a) => (
            <li key={a.id} className="col-span-12 md:col-span-6 border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-2)]">
                {a.is_default ? 'Predeterminada' : 'Dirección'}
              </p>
              <p className="font-medium">{a.recipient}</p>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ''}
                <br />
                {a.city}, {a.state} · C.P. {a.postal_code}
                <br />
                {a.phone}
              </p>
              <div className="flex gap-[var(--space-3)] mt-[var(--space-3)]">
                <button
                  type="button"
                  className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
                  onClick={() => setEditing(a)}
                >
                  Editar
                </button>
                <form action={async () => { await deleteAddressAction(a.id); }}>
                  <button type="submit" className="font-mono text-xs text-[var(--danger)] underline underline-offset-4">
                    Quitar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-primary w-fit" onClick={() => setCreating(true)}>
          Agregar dirección
        </button>
      </div>
    );
  }

  const current = editing;

  return (
    <form action={formAction} className="flex flex-col gap-[var(--space-4)] max-w-xl" noValidate>
      {current ? <input type="hidden" name="id" value={current.id} /> : null}

      <div className="grid grid-cols-2 gap-[var(--space-4)]">
        <div className="col-span-2">
          <label htmlFor="recipient" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            ¿A quién se entrega?
          </label>
          <input id="recipient" name="recipient" className={field} defaultValue={current?.recipient} required />
          {state?.status === 'error' && state.fieldErrors?.recipient ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.recipient}</p>
          ) : null}
        </div>

        <div className="col-span-2">
          <label htmlFor="line1" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Calle y número
          </label>
          <input id="line1" name="line1" className={field} defaultValue={current?.line1} required />
          {state?.status === 'error' && state.fieldErrors?.line1 ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.line1}</p>
          ) : null}
        </div>

        <div className="col-span-2">
          <label htmlFor="line2" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Interior, referencias (opcional)
          </label>
          <input id="line2" name="line2" className={field} defaultValue={current?.line2 ?? ''} />
        </div>

        <div>
          <label htmlFor="city" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Ciudad
          </label>
          <input id="city" name="city" className={field} defaultValue={current?.city} required />
          {state?.status === 'error' && state.fieldErrors?.city ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.city}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="state" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Estado
          </label>
          <input id="state" name="state" className={field} defaultValue={current?.state} required />
          {state?.status === 'error' && state.fieldErrors?.state ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.state}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="postalCode" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Código postal
          </label>
          <input
            id="postalCode"
            name="postalCode"
            className={field}
            inputMode="numeric"
            maxLength={5}
            defaultValue={current?.postal_code}
            required
          />
          {state?.status === 'error' && state.fieldErrors?.postalCode ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.postalCode}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            className={field}
            inputMode="tel"
            defaultValue={current?.phone}
            required
          />
          {state?.status === 'error' && state.fieldErrors?.phone ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-[var(--space-2)] text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={current?.is_default ?? addresses.length === 0}
          className="w-4 h-4 accent-[var(--brass)]"
        />
        Usar como predeterminada
      </label>

      <p aria-live="polite" className="min-h-5 text-xs">
        {state?.status === 'ok' ? <span className="text-[var(--ok)]">{state.message}</span> : null}
        {state?.status === 'error' ? <span className="text-[var(--danger)]">{state.message}</span> : null}
      </p>

      <div className="flex gap-[var(--space-3)]">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar dirección'}
        </button>
        <button type="button" className="btn-secondary" onClick={done}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
