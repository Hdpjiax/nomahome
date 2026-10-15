'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

type Mode = 'entrar' | 'crear' | 'magico';

/**
 * Acceso a la cuenta (§8): contraseña o enlace mágico por correo.
 * La sesión vive en cookies httpOnly de Supabase; el rol nunca se toca
 * aquí ni se guarda en localStorage.
 */
export default function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    const supabase = createBrowserClient();

    try {
      if (mode === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError('Ese correo o contraseña no coincide. Revísalo.');
          return;
        }
        router.push('/cuenta');
        router.refresh();
      } else if (mode === 'crear') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) {
          setError(
            error.message.includes('already')
              ? 'Ese correo ya tiene cuenta. Entra con tu contraseña.'
              : 'No se pudo crear la cuenta. Revisa el correo y la contraseña (mínimo 6 caracteres).'
          );
          return;
        }
        // Con confirmación por correo activada hay que revisar la bandeja;
        // en local la sesión llega directo.
        setNotice('Cuenta creada. Si te pedimos confirmar, revisa tu correo y vuelve a entrar.');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${siteUrl}/cuenta`, shouldCreateUser: false },
        });
        if (error) {
          setError('No pudimos mandar el enlace. Revisa el correo.');
          return;
        }
        setNotice('Enlace mágico en camino. Ábrelo desde tu correo para entrar.');
      }
    } finally {
      setPending(false);
    }
  }

  const field =
    'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';

  return (
    <div className="max-w-md">
      <div className="flex gap-[var(--space-4)] mb-[var(--space-5)] font-mono text-xs uppercase tracking-[0.08em]">
        {(
          [
            ['entrar', 'Entrar'],
            ['crear', 'Crear cuenta'],
            ['magico', 'Enlace mágico'],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
              setNotice(null);
            }}
            className={`pb-1 border-b-2 ${
              mode === value
                ? 'border-[var(--brass)] text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-soft)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-[var(--space-4)]" noValidate>
        {mode === 'crear' ? (
          <div>
            <label htmlFor="fullName" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
              Nombre
            </label>
            <input
              id="fullName"
              className={field}
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
            Correo
          </label>
          <input
            id="email"
            type="email"
            className={field}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mode !== 'magico' ? (
          <div>
            <label htmlFor="password" className="block font-mono text-[11px] uppercase tracking-[0.08em] mb-[var(--space-2)]">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={field}
              autoComplete={mode === 'crear' ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        ) : null}

        <p aria-live="polite" className="min-h-5 text-xs">
          {error ? <span className="text-[var(--danger)]">{error}</span> : null}
          {notice ? <span className="text-[var(--ok)]">{notice}</span> : null}
        </p>

        <button type="submit" className="btn-primary" disabled={pending}>
          {pending
            ? 'Un momento…'
            : mode === 'entrar'
              ? 'Entrar a mi cuenta'
              : mode === 'crear'
                ? 'Crear mi cuenta'
                : 'Mandarme el enlace'}
        </button>
      </form>

      <p className="mt-[var(--space-4)] text-xs text-[var(--ink-soft)] leading-relaxed">
        Con tu cuenta guardamos direcciones y favoritos, y ves el historial
        de tus pedidos. También puedes comprar como invitado: te pedimos el
        correo al pagar.
      </p>
    </div>
  );
}
