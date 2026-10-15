import Link from 'next/link';
import { StoreFooter, StoreHeader } from '@/components/store/Chrome';

/**
 * Navegación de cuenta: la misma materia de la tienda, en mono pequeño.
 */
export function AccountNav({ active }: { active: 'resumen' | 'pedidos' | 'direcciones' | 'favoritos' | 'facturacion' }) {
  const items: { key: typeof active; href: string; label: string }[] = [
    { key: 'resumen', href: '/cuenta', label: 'Resumen' },
    { key: 'pedidos', href: '/cuenta/pedidos', label: 'Pedidos' },
    { key: 'direcciones', href: '/cuenta/direcciones', label: 'Direcciones' },
    { key: 'favoritos', href: '/cuenta/favoritos', label: 'Favoritos' },
    { key: 'facturacion', href: '/cuenta/facturacion', label: 'Facturación' },
  ];
  return (
    <nav aria-label="Cuenta" className="flex flex-wrap gap-x-[var(--space-5)] gap-y-2 border-b border-[var(--line)] pb-[var(--space-3)] mb-[var(--space-6)]">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={active === i.key ? 'page' : undefined}
          className={`font-mono text-xs uppercase tracking-[0.08em] pb-1 border-b-2 transition-colors ${
            active === i.key
              ? 'border-[var(--brass)] text-[var(--ink)]'
              : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <StoreHeader />
      <main id="contenido" className="flex-1 pt-16">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}
