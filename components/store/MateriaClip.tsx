import LuxuryImage from './LuxuryImage';
import { CATEGORY_LUXURY_MEDIA } from '@/lib/catalog/photo-registry';

/**
 * Tarjeta visual de materia para la franja de oficios/categorías (§8 inicio):
 * combina fotografía de materia real en alta resolución con respaldo de
 * estudio local y etiqueta técnica de taller.
 */
export default function MateriaClip({ slug }: { slug: string }) {
  const meta = CATEGORY_LUXURY_MEDIA[slug] ?? CATEGORY_LUXURY_MEDIA['muebles']!;

  return (
    <div className="relative block w-full aspect-[4/3] rounded-[var(--radius-m)] overflow-hidden bg-[var(--paper-2)] border border-[var(--line)]">
      <LuxuryImage
        src={meta.unsplashUrl}
        fallbackSrc={meta.fallbackUrl}
        alt={`Materia de taller: ${slug}`}
        className="w-full h-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#1c1712]/80 via-[#1c1712]/25 to-transparent"
      />
      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 text-[#f3eee6]">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#c4a27a]">
          {meta.materialTag}
        </span>
        <span className="text-xs text-[#f3eee6]/90 leading-snug">{meta.specLine}</span>
      </div>
    </div>
  );
}
