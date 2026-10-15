import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';

/**
 * Layout del panel (§6 admin skill): sesión y role=admin verificados en
 * SERVIDOR antes de renderizar nada. Misma materia editorial, mayor
 * densidad, mono para datos. No es un panel gris.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const nav = [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/productos', label: 'Productos' },
    { href: '/admin/categorias', label: 'Categorías' },
    { href: '/admin/inicio', label: 'Inicio' },
    { href: '/admin/resenas', label: 'Reseñas' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-sm sticky top-0 z-30">
        <div className="container-lumen h-14 flex items-center justify-between gap-[var(--space-4)]">
          <div className="flex items-baseline gap-[var(--space-4)]">
            <Link href="/admin" className="font-display text-lg font-semibold tracking-[-0.01em]">
              NOMAHOME <span className="text-[var(--brass)]">· taller</span>
            </Link>
          </div>
          <nav aria-label="Panel" className="flex items-center gap-[var(--space-4)] font-mono text-[12px] uppercase tracking-[0.08em] overflow-x-auto">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:underline underline-offset-4 whitespace-nowrap">
                {n.label}
              </Link>
            ))}
            <Link href="/" className="text-[var(--brass)] hover:underline underline-offset-4 whitespace-nowrap">
              Ver tienda ↗
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
