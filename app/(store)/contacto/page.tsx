import type { Metadata } from 'next';
import ContactForm from './ContactForm';
import PageFade from '@/components/motion/PageFade';
import { waLink, waQuestion } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contacto — NOMAHOME',
  description: 'Escríbenos por WhatsApp o deja un mensaje: contesta el taller, no un bot.',
  alternates: { canonical: '/contacto' },
};

export default function ContactPage() {
  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-6)]">
          <p className="text-catalog mb-[var(--space-3)]">Contacto</p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
            Escríbenos del pedido o de la pieza.
          </h1>
          <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
            Contestamos en horario de taller: lunes a viernes 10–18 h y
            sábados 10–14 h. Si es por una pieza con nombre y número de
            catálogo, inclúyelo: llega directo a quien la hizo.
          </p>
        </header>

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
          <section aria-labelledby="wa" className="col-span-12 md:col-span-5">
            <h2 id="wa" className="font-display text-2xl mb-[var(--space-4)]">WhatsApp</h2>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-[var(--space-4)]">
              Para medidas, colores y tiempos de entrega es lo más rápido. Una
              persona del taller contesta, no un bot.
            </p>
            <a
              href={waLink(waQuestion())}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Abrir WhatsApp
            </a>
            <dl className="mt-[var(--space-6)] text-sm space-y-[var(--space-3)] text-[var(--ink-soft)]">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em]">Taller</dt>
                <dd>Morelia, Michoacán</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.08em]">Correo</dt>
                <dd>
                  <a href="mailto:hola@nomahome.us" className="underline underline-offset-4 decoration-[var(--brass)]">
                    hola@nomahome.us
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="form" className="col-span-12 md:col-span-6 md:col-start-7">
            <h2 id="form" className="font-display text-2xl mb-[var(--space-4)]">Mensaje</h2>
            <ContactForm />
          </section>
        </div>
      </div>
    </PageFade>
  );
}
