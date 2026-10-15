'use client';

import { useActionState } from 'react';
import { submitContact } from './actions';
import type { ContactState } from '@/lib/validators/contact';

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';

export default function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState | null, FormData>(
    submitContact,
    null
  );

  if (state?.ok) {
    return (
      <div className="border-t border-b border-[var(--line)] py-[var(--space-5)]">
        <p className="font-display text-2xl mb-[var(--space-2)]">Mensaje en el tablón del taller.</p>
        <p className="text-sm text-[var(--ink-soft)]">
          Te contestamos a tu correo en horario de taller: lunes a viernes 10–18 h.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-12 gap-[var(--space-4)]" noValidate>
      {state && !state.ok && state.error ? (
        <p role="alert" className="col-span-12 text-sm text-[var(--danger)] border-l-2 border-[var(--danger)] pl-[var(--space-3)]">
          {state.error}
        </p>
      ) : null}

      <div className="col-span-12 md:col-span-6">
        <label htmlFor="name" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
          Nombre
        </label>
        <input id="name" name="name" required className={field} autoComplete="name" />
        {state && !state.ok && state.fieldErrors?.name ? (
          <p className="mt-[var(--space-1)] text-xs text-[var(--danger)]">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="col-span-12 md:col-span-6">
        <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
          Correo
        </label>
        <input id="email" name="email" type="email" required className={field} autoComplete="email" />
        {state && !state.ok && state.fieldErrors?.email ? (
          <p className="mt-[var(--space-1)] text-xs text-[var(--danger)]">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="col-span-12 md:col-span-6">
        <label htmlFor="phone" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
          Teléfono (opcional)
        </label>
        <input id="phone" name="phone" className={field} autoComplete="tel" />
      </div>

      <div className="col-span-12">
        <label htmlFor="body" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
          Mensaje
        </label>
        <textarea id="body" name="body" rows={5} required className={field} />
        {state && !state.ok && state.fieldErrors?.body ? (
          <p className="mt-[var(--space-1)] text-xs text-[var(--danger)]">{state.fieldErrors.body}</p>
        ) : null}
      </div>

      <div className="col-span-12">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Dejar el mensaje'}
        </button>
      </div>
    </form>
  );
}
