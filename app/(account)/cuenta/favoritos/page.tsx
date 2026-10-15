import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublishedPieces } from '@/lib/catalog/queries';
import { AccountNav } from '../../layout';
import PieceCard from '@/components/store/PieceCard';
import PageFade from '@/components/motion/PageFade';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tus favoritos — NOMAHOME',
  robots: { index: false },
};

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) redirect('/cuenta');

  const supabase = await createSupabaseServerClient();
  const { data: favorites } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', user.id);

  const ids = new Set((favorites ?? []).map((f) => f.product_id));
  const pieces = (await getPublishedPieces()).filter((p) => ids.has(p.id));

  return (
    <PageFade>
      <div className="container-lumen pt-[var(--space-7)] pb-[var(--space-8)]">
        <p className="text-catalog mb-[var(--space-3)]">Cuenta</p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95] mb-[var(--space-6)]">
          Piezas guardadas
        </h1>

        <AccountNav active="favoritos" />

        {pieces.length === 0 ? (
          <div className="border-t border-b border-[var(--line)] py-[var(--space-7)]">
            <h2 className="font-display text-2xl mb-[var(--space-3)]">Sin piezas guardadas todavía.</h2>
            <p className="text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
              En la ficha de cada pieza hay un botón para guardarla. Vuelve a
              ella cuando quieras, sin buscarla otra vez.
            </p>
            <Link href="/categoria/muebles" className="btn-primary mt-[var(--space-5)] inline-block text-sm">
              Recorrer el catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-[var(--space-5)] gap-y-[var(--space-7)]">
            {pieces.map((p) => (
              <PieceCard key={p.id} piece={p} />
            ))}
          </div>
        )}
      </div>
    </PageFade>
  );
}
