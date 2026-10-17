import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getHomepageBlocks, getPublishedPieces } from '@/lib/catalog/queries';
import MateriaClip from '@/components/store/MateriaClip';
import PageFade from '@/components/motion/PageFade';
import Reveal from '@/components/motion/Reveal';
import {
  CraftAnatomyPillars,
  HeroVitrina,
  InteractiveCatalogShowcase,
  InteractiveRoomLookbook,
} from '@/components/store/HomeLuxuryExperience';
import { waLink, waQuestion } from '@/lib/whatsapp';

// El catálogo se lee en cada request: lo que el taller publica o despublica
// se ve al instante, y el stock de la ficha nunca queda horneado.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'NOMAHOME — Muebles de autor, iluminación 2700K y tecnología del hogar',
  description:
    'Casa de ebanistería y tecnología residencial en Morelia: muebles en parota y roble macizo de 4 cm, iluminación cálida en latón y audio de estudio con medida y precio a la vista.',
  alternates: { canonical: '/' },
};

type Block = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  product_id: string | null;
  sort_order: number;
};

function CategoriesBlock({
  block,
  categories,
}: {
  block: Block;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  return (
    <section className="container-lumen py-[var(--space-7)] border-b border-[var(--line)]">
      <div className="grid grid-cols-12 gap-x-[var(--space-5)] mb-[var(--space-5)]">
        <div className="col-span-12 md:col-span-5">
          <p className="text-catalog mb-2">Disciplinas del Taller</p>
          <h2 className="font-display text-3xl md:text-4xl tracking-[-0.02em]">{block.title}</h2>
        </div>
        {block.body ? (
          <p className="col-span-12 md:col-span-5 md:col-start-8 text-sm text-[var(--ink-soft)] leading-relaxed self-end">
            {block.body}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)]">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="group flex flex-col gap-[var(--space-3)] p-3 rounded-[var(--radius-m)] bg-[var(--paper-2)]/60 border border-[var(--line)] hover:border-[var(--brass)] transition-all"
          >
            <div className="overflow-hidden rounded-[var(--radius-m)]">
              <div className="transition-transform duration-[700ms] ease-[var(--ease)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <MateriaClip slug={c.slug} />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-1">
              <div>
                <h3 className="font-display text-xl leading-tight group-hover:underline underline-offset-4 decoration-[var(--brass)]">
                  {c.name}
                </h3>
                {c.description ? (
                  <p className="text-xs text-[var(--ink-soft)] mt-1 line-clamp-2">
                    {c.description}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--brass)]">
                {c.productCount} {c.productCount === 1 ? 'pieza' : 'piezas'} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CraftNoteBlock({ block }: { block: Block }) {
  return (
    <Reveal
      id="oficio"
      className="container-lumen py-[var(--space-8)] border-b border-[var(--line)]"
    >
      <div className="grid grid-cols-12 gap-x-[var(--space-5)]">
        <div className="col-span-12 md:col-span-2">
          <p className="text-catalog">Nota de oficio</p>
        </div>
        <blockquote className="col-span-12 md:col-span-7">
          <p className="font-display text-2xl md:text-[34px] leading-[1.15] tracking-[-0.01em]">
            “{block.body ?? block.title}”
          </p>
          <div className="mt-[var(--space-5)] h-[3px] w-16 bg-[var(--brass)]" aria-hidden />
        </blockquote>
        <div className="col-span-12 md:col-span-3 pt-[var(--space-5)] md:pt-0 text-sm text-[var(--ink-soft)] leading-relaxed">
          <p>
            Resortes atados a mano. Cera natural renovable. Cable escondido en la madera. Medidas
            reales que entran por tu puerta y tu escalera.
          </p>
        </div>
      </div>

      <CraftAnatomyPillars />
    </Reveal>
  );
}

function ContactBlock({ block }: { block: Block }) {
  return (
    <section className="container-lumen py-[var(--space-8)]">
      <div className="p-[var(--space-6)] rounded-[var(--radius-m)] bg-[var(--paper-2)] border border-[var(--line-strong)] grid grid-cols-12 gap-x-[var(--space-5)] gap-y-6 items-center">
        <div className="col-span-12 md:col-span-7">
          <p className="text-catalog mb-2">Atención Directa · Sin Intermediarios</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-[-0.02em] leading-tight">
            {block.title}
          </h2>
          {block.body ? (
            <p className="mt-[var(--space-3)] text-[var(--ink-soft)] leading-relaxed max-w-xl">
              {block.body}
            </p>
          ) : null}
        </div>
        <div className="col-span-12 md:col-span-5 flex flex-wrap md:justify-end gap-3">
          <a
            href={waLink(waQuestion())}
            className="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
          <Link href="/contacto" className="btn-secondary">
            Formulario de taller
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [blocks, pieces, categories] = await Promise.all([
    getHomepageBlocks(),
    getPublishedPieces(),
    getCategories(),
  ]);

  const byKind = (kind: string) => blocks.find((b) => b.kind === kind);
  const opening = byKind('opening');
  const piecesBlock = byKind('pieces');
  const categoriesBlock = byKind('categories');
  const craftBlock = byKind('craft_note');
  const contactBlock = byKind('contact');

  return (
    <PageFade>
      {/* 1. Vitrina Inmediata de Piezas Destacadas + Selección de Colecciones */}
      <HeroVitrina
        headline={opening?.title ?? 'Una casa se arma con piezas que aguanten la vida.'}
        subheadline={
          opening?.body ??
          'Ebanistería en parota y roble macizo de 4 cm, luz cálida 2700 K y tecnología acústica desde nuestro taller en Morelia.'
        }
        pieces={pieces}
        categories={categories}
      />

      {/* 2. Productos Destacados y Catálogo Interactivo en Vivo */}
      <InteractiveCatalogShowcase
        title={piecesBlock?.title ?? 'Piezas destacadas del taller'}
        subtitle={
          piecesBlock?.body ??
          'Cambia el acabado de cada pieza para ver su fotografía, medidas y disponibilidad en tiempo real, o agrégala directo a tu pedido.'
        }
        pieces={pieces}
        categories={categories}
      />

      {/* 3. Lookbook Interactivo "Espacios NOMA · Shop the Room" */}
      <InteractiveRoomLookbook pieces={pieces} />

      {/* 4. Los Cuatro Oficios (Categorías con Fotografía de Materia) */}
      {categoriesBlock ? <CategoriesBlock block={categoriesBlock} categories={categories} /> : null}

      {/* 5. Nota de Oficio y Anatomía de Materiales (con Reveal whileInView) */}
      {craftBlock ? <CraftNoteBlock block={craftBlock} /> : null}

      {/* 6. Concierge del Taller por WhatsApp */}
      {contactBlock ? <ContactBlock block={contactBlock} /> : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'NOMAHOME',
            description: metadata.description,
            inLanguage: 'es-MX',
          }),
        }}
      />
    </PageFade>
  );
}
