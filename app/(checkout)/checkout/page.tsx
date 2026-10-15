import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCartView } from '@/lib/cart/service';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { listAddresses } from '@/lib/account/actions';
import CheckoutForm, { type SavedAddress } from './CheckoutForm';
import PageFade from '@/components/motion/PageFade';
import { waLink, waQuestion } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout — NOMAHOME',
  robots: { index: false },
};

export default async function CheckoutPage() {
  const cart = await getCartView();
  if (!cart || cart.lines.length === 0) redirect('/carrito');

  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;
  const addresses: SavedAddress[] = user
    ? (await listAddresses()).map((a) => ({
        id: a.id,
        recipient: a.recipient,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        postal_code: a.postal_code,
        phone: a.phone,
        is_default: a.is_default,
      }))
    : [];

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">
            <Link href="/carrito" className="hover:underline">Carrito</Link> / Checkout
          </p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
            Casi tuyo.
          </h1>
          <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
            Todo en esta página: datos, dirección y cobro por transferencia
            SPEI. El taller confirma tu pago al verlo en el banco y tu pedido
            pasa a pagado solo entonces.
          </p>
        </header>

        <CheckoutForm
          cart={cart}
          user={user ? { email: user.email ?? '', name: profile?.fullName ?? '' } : null}
          addresses={addresses}
          clabe={process.env.NEXT_PUBLIC_STORE_CLABE ?? ''}
          bank={process.env.NEXT_PUBLIC_STORE_BANK ?? ''}
        />

        <p className="mt-[var(--space-6)] text-xs text-[var(--ink-soft)]">
          ¿Dudas antes de pagar?{' '}
          <a
            href={waLink(waQuestion())}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-[var(--brass)]"
          >
            Habla del pedido por WhatsApp
          </a>{' '}
          — no cambia el estado de tu pedido, solo resuelve dudas.
        </p>
      </div>
    </PageFade>
  );
}
