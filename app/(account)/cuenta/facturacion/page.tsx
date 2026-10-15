import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AccountNav } from '../../layout';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Facturación — NOMAHOME',
  description: 'Datos fiscales y facturas CFDI 4.0 de tus pedidos pagados.',
  robots: { index: false },
};

/**
 * La captura de datos fiscales (RFC, régimen, uso de CFDI con los
 * catálogos vigentes) y el timbrado CFDI 4.0 llegan con la fase de
 * facturación. Aquí solo decimos la verdad del estado actual.
 */
export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect('/cuenta');

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Facturación
        </h1>

        <AccountNav active="facturacion" />

        <div className="border-t border-b border-[var(--line)] py-[var(--space-7)] max-w-2xl">
          <h2 className="font-display text-2xl mb-[var(--space-3)]">
            La factura se pide cuando el pedido está pagado.
          </h2>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
            Cuando un pedido tuyo pase a pagado, aquí capturas tus datos
            fiscales (RFC, razón social, régimen y uso de CFDI) y pides la
            factura CFDI 4.0 timbrada. El timbrado llega del SAT vía nuestro
            emisor autorizado: no hay facturas caseras.
          </p>
        </div>
      </div>
    </PageFade>
  );
}
