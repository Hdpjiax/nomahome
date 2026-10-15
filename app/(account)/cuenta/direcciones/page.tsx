import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listAddresses } from '@/lib/account/actions';
import { AccountNav } from '../../layout';
import AddressManager from './AddressManager';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tus direcciones — NOMAHOME',
  robots: { index: false },
};

export default async function AddressesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/cuenta');

  const addresses = await listAddresses();

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Direcciones de entrega
        </h1>

        <AccountNav active="direcciones" />

        <p className="mb-[var(--space-5)] text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
          Las direcciones que guardes aquí aparecen listas en el checkout.
          La que marques como predeterminada se selecciona primero.
        </p>

        <AddressManager
          addresses={addresses.map((a) => ({
            id: a.id,
            recipient: a.recipient,
            line1: a.line1,
            line2: a.line2,
            city: a.city,
            state: a.state,
            postal_code: a.postal_code,
            phone: a.phone,
            is_default: a.is_default,
          }))}
        />
      </div>
    </PageFade>
  );
}
