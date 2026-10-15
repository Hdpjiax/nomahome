import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCategories, getHomepageBlocks, getPublishedPieces } from '@/lib/catalog/queries';
import type { CatalogPiece } from '@/lib/catalog/types';
import PieceCard from '@/components/store/PieceCard';
import MateriaClip from '@/components/store/MateriaClip';
import PageFade from '@/components/motion/PageFade';
import Reveal from '@/components/motion/Reveal';
import { waLink, waQuestion } from '@/lib/whatsapp';

// El catálogo se lee en cada request: lo que el taller publica o despublica
// se ve al instante, y el stock de la ficha nunca queda horneado.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'NOMAHOME — Muebles y tecnología para vivir la casa',
  description:
    'Catálogo de taller desde Morelia: muebles de madera y acero, luz cálida y tecnología del hogar que no clama atención. Piezas con medida, material y precio a la vista.',
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

function OpeningBlock({ block, piece }: { block: Block; piece: CatalogPiece | null }) {
  const variant = piece?.variants[0];
  const media = variant?.media[0];
  return (
    <section className="container-lumen grid grid-cols-12 gap-x-[var(--space-5)] items-end pt-[var(--space-8)] pb-[var(--space-6)]">
      <div className="col-span-12 md:col-span-5 pb-[var(--space-6)] md:pb-0">
        <p className="text-catalog mb-[var(--space-5)]">Taller en Morelia · Catálogo 2026</p>
        <h1 className="font-display font-semibold text-[52px] sm:text-[64px] md:text-[76px] lg:text-[88px] leading-[0.92] tracking-[-0.03em]">
          {block.title}
        </h1>
        {block.body ? (
          <p className="mt-[var(--space-5)] max-w-md text-[var(--ink-soft)] leading-relaxed">
            {block.body}
          </p>
        ) : null}
        <div className="mt-[var(--space-6)] flex flex-wrap items-center gap-[var(--space-4)]">
          {piece ? (
            <Link href={`/producto/${piece.slug}`} className="btn-primary">
              Ver la pieza del mes
            </Link>
          ) : null}
          <a
            href={waLink(waQuestion())}
            className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar con el taller
          </a>
        </div>
      </div>

      <div className="col-span-12 md:col-span-7 md:mr-[calc(50%-50vw)] md:pl-[var(--space-5)]">
        {media ? (
          <Image
            src={media.path}
            alt={media.alt || (piece?.name ?? 'Pieza del taller')}
            width={media.width ?? 800}
            height={media.height ?? 1000}
            priority
            className="w-full aspect-[4/5] md:aspect-auto md:h-[74vh] object-cover rounded-[var(--radius-m)]"
          />
        ) : (
          <div className="w-full aspect-[4/5] bg-[var(--paper-2)] rounded-[var(--radius-m)]" />
        )}
        {piece ? (
          <p className="text-catalog mt-[var(--space-3)]">
            {piece.sku} — {piece.name}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CategoriesBlock({
  block,
  categories,
}: {
  block: Block;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  return (
    <section className="container-lumen py-[var(--space-7)] border-t border-[var(--line)]">
      <div className="grid grid-cols-12 gap-x-[var(--space-5)] mb-[var(--space-5)]">
        <h2 className="col-span-12 md:col-span-4 font-display text-3xl md:text-4xl tracking-[-0.02em]">
          {block.title}
        </h2>
        {block.body ? (
          <p className="col-span-12 md:col-span-5 md:col-start-8 text-sm text-[var(--ink-soft)] leading-relaxed self-end">
            {block.body}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)]">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/categoria/${c.slug}`}
            className="group flex flex-col gap-[var(--space-3)]"
          >
            <div className="overflow-hidden rounded-[var(--radius-m)]">
              <div className="transition-transform duration-[700ms] ease-[var(--ease)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <MateriaClip slug={c.slug} />
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg leading-tight">{c.name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                {c.productCount} {c.productCount === 1 ? 'pieza' : 'piezas'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Cuatro piezas en composición asimétrica: 7 / 5 / 5 / 7 (§5). */
const SPANS = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

function PiecesBlock({ block, pieces }: { block: Block; pieces: CatalogPiece[] }) {
  return (
    <section className="container-lumen py-[var(--space-7)] border-t border-[var(--line)]">
      <div className="grid grid-cols-12 gap-x-[var(--space-5)] mb-[var(--space-6)]">
        <h2 className="col-span-12 md:col-span-5 font-display text-3xl md:text-4xl tracking-[-0.02em]">
          {block.title}
        </h2>
        {block.body ? (
          <p className="col-span-12 md:col-span-4 md:col-start-9 text-sm text-[var(--ink-soft)] leading-relaxed self-end">
            {block.body}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-[var(--space-5)] gap-y-[var(--space-7)]">
        {pieces.slice(0, 4).map((piece, i) => (
          <div key={piece.id} className={`col-span-1 ${SPANS[i % SPANS.length]}`}>
            <PieceCard piece={piece} priority={i === 0} />
          </div>
        ))}
      </div>
      <div className="mt-[var(--space-7)]">
        <Link href="/categoria/muebles" className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]">
          Recorrer el catálogo completo →
        </Link>
      </div>
    </section>
  );
}

function CraftNoteBlock({ block }: { block: Block }) {
  return (
    <Reveal
      id="oficio"
      className="container-lumen py-[var(--space-8)] border-t border-[var(--line)]"
    >
      <div className="grid grid-cols-12 gap-x-[var(--space-5)]">
        <div className="col-span-12 md:col-span-2">
          <p className="text-catalog">Nota de oficio</p>
        </div>
        <blockquote className="col-span-12 md:col-span-7">
          <p className="font-display text-2xl md:text-[32px] leading-[1.15] tracking-[-0.01em]">
            “{block.body ?? block.title}”
          </p>
          <div className="mt-[var(--space-5)] h-[3px] w-16 bg-[var(--brass)]" aria-hidden />
        </blockquote>
        <div className="col-span-12 md:col-span-3 pt-[var(--space-5)] md:pt-0 text-sm text-[var(--ink-soft)] leading-relaxed">
          <p>
            Resortes atados a mano. Cera natural. Cable escondido en la madera.
            Medidas que caben en tu escalera y en tu puerta.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function ContactBlock({ block }: { block: Block }) {
  return (
    <section className="container-lumen py-[var(--space-8)] border-t border-[var(--line)]">
      <div className="grid grid-cols-12 gap-x-[var(--space-5)] items-baseline">
        <h2 className="col-span-12 md:col-span-5 font-display text-3xl md:text-5xl tracking-[-0.02em] leading-tight">
          {block.title}
        </h2>
        <div className="col-span-12 md:col-span-4 md:col-start-8 mt-[var(--space-4)] md:mt-0">
          {block.body ? (
            <p className="text-[var(--ink-soft)] leading-relaxed">{block.body}</p>
          ) : null}
          <a
            href={waLink(waQuestion())}
            className="btn-primary mt-[var(--space-5)] inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
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

  if (pieces.length === 0) {
    return (
      <PageFade>
        <div className="container-lumen py-[var(--space-8)]">
          <p className="text-catalog mb-[var(--space-4)]">Catálogo</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-[-0.02em]">
            El taller está acomodando las piezas.
          </h1>
          <p className="mt-[var(--space-4)] text-[var(--ink-soft)] max-w-lg leading-relaxed">
            En cuanto haya piezas publicadas, aparecen aquí con su número, su
            material y su precio. Vuelve en un rato.
          </p>
        </div>
      </PageFade>
    );
  }

  const byKind = (kind: string) => blocks.find((b) => b.kind === kind);
  const anchor = (productId: string | null) =>
    productId ? (pieces.find((p) => p.id === productId) ?? null) : null;

  const opening = byKind('opening');
  const openingPiece = anchor(opening?.product_id ?? null) ?? pieces[0];

  const piecesBlock = byKind('pieces');
  const piecesAnchor = anchor(piecesBlock?.product_id ?? null);
  const four = [
    ...(piecesAnchor ? [piecesAnchor] : []),
    ...pieces.filter((p) => p.id !== piecesAnchor?.id),
  ].slice(0, 4);

  return (
    <PageFade>
      {opening ? <OpeningBlock block={opening} piece={openingPiece} /> : null}
      {byKind('categories') ? (
        <CategoriesBlock block={byKind('categories')!} categories={categories} />
      ) : null}
      {piecesBlock ? <PiecesBlock block={piecesBlock} pieces={four} /> : null}
      {byKind('craft_note') ? <CraftNoteBlock block={byKind('craft_note')!} /> : null}
      {byKind('contact') ? <ContactBlock block={byKind('contact')!} /> : null}

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
