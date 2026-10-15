import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { AccountNav } from '../layout';
import AuthPanel from '@/components/account/AuthPanel';
import ProfileForm from './ProfileForm';
import PageFade from '@/components/motion/PageFade';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tu cuenta — NOMAHOME',
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  const profile = await getProfile();

  if (!user || !profile) {
    return (
      <PageFade>
        <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
          <header className="mb-[var(--space-6)]">
            <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
            <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
              Tu cuenta del taller.
            </h1>
            <p className="mt-[var(--space-4)] max-w-lg text-[var(--ink-soft)] leading-relaxed">
              Pedidos, direcciones, favoritos y datos de facturación en un
              solo lugar.
            </p>
          </header>
          <AuthPanel />
        </div>
      </PageFade>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [orders, addresses, favorites] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('favorites').select('product_id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const counts = [
    { label: 'Pedidos', value: orders.count ?? 0, href: '/cuenta/pedidos' },
    { label: 'Direcciones', value: addresses.count ?? 0, href: '/cuenta/direcciones' },
    { label: 'Favoritos', value: favorites.count ?? 0, href: '/cuenta/favoritos' },
  ];

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Hola, {profile.fullName.split(' ')[0] || 'del taller'}.
        </h1>

        <AccountNav active="resumen" />

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-7)]">
          <section className="col-span-12 md:col-span-6">
            <h2 className="font-display text-2xl mb-[var(--space-4)]">Tus datos</h2>
            <ProfileForm profile={profile} email={user.email ?? ''} />
          </section>

          <section className="col-span-12 md:col-span-5 md:col-start-8">
            <h2 className="font-display text-2xl mb-[var(--space-4)]">De un vistazo</h2>
            <ul className="divide-y divide-[var(--line)]">
              {counts.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="flex items-baseline justify-between py-[var(--space-4)] hover:text-[var(--brass)] transition-colors"
                  >
                    <span className="font-mono text-sm uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                      {c.label}
                    </span>
                    <span className="font-display text-2xl">{c.value}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageFade>
  );
}
