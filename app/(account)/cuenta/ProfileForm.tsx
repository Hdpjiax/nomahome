'use client';

import { useActionState } from 'react';
import { updateProfileAction, signOutAction, type AccountState } from '@/lib/account/actions';
import type { Profile } from '@/lib/auth/session';

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';

/**
 * Datos de la cuenta: nombre y teléfono. El rol no se muestra ni se edita
 * aquí — no es editable por el cliente (grants por columna en profiles).
 */
export default function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState<AccountState | null, FormData>(
    updateProfileAction,
    null
  );

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <form action={formAction} className="flex flex-col gap-[var(--space-4)] max-w-md" noValidate>
        <div>
          <span className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Correo de la cuenta
          </span>
          <input className={`${field} opacity-60`} value={email} readOnly aria-readonly />
        </div>

        <div>
          <label htmlFor="fullName" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Nombre
          </label>
          <input
            id="fullName"
            name="fullName"
            className={field}
            autoComplete="name"
            defaultValue={profile.fullName}
            required
          />
          {state?.status === 'error' && state.fieldErrors?.fullName ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.fullName}</p>
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
            autoComplete="tel"
            inputMode="tel"
            defaultValue={profile.phone ?? ''}
          />
          {state?.status === 'error' && state.fieldErrors?.phone ? (
            <p className="mt-1 text-xs text-[var(--danger)]">{state.fieldErrors.phone}</p>
          ) : null}
        </div>

        <p aria-live="polite" className="min-h-5 text-xs">
          {state?.status === 'ok' ? <span className="text-[var(--ok)]">{state.message}</span> : null}
          {state?.status === 'error' ? <span className="text-[var(--danger)]">{state.message}</span> : null}
        </p>

        <button type="submit" className="btn-primary w-fit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar datos'}
        </button>
      </form>

      <form action={signOutAction} className="pt-[var(--space-5)] border-t border-[var(--line)]">
        <button type="submit" className="btn-secondary w-fit text-sm">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
