import type { ReactNode } from 'react';
import PageFade from '@/components/motion/PageFade';

export type LegalSection = {
  heading: string;
  children: ReactNode;
};

/**
 * Cuerpo de página editorial para legales e información del pedido.
 * Texto propio de taller, no copiado de otro sitio (§8).
 */
export default function LegalBody({
  kicker,
  title,
  lede,
  sections,
}: {
  kicker: string;
  title: string;
  lede?: string;
  sections: LegalSection[];
}) {
  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <header className="mb-[var(--space-7)] border-b border-[var(--line)] pb-[var(--space-5)]">
          <p className="text-catalog mb-[var(--space-3)]">{kicker}</p>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95] max-w-3xl">
            {title}
          </h1>
          {lede ? (
            <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
              {lede}
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
          {sections.map((s, i) => (
            <section
              key={s.heading}
              className={`col-span-12 md:col-span-6 ${i % 2 === 1 ? 'md:col-start-7' : ''}`}
            >
              <h2 className="font-display text-2xl mb-[var(--space-3)]">{s.heading}</h2>
              <div className="text-sm text-[var(--ink-soft)] leading-relaxed space-y-[var(--space-3)]">
                {s.children}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
