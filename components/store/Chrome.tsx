import Link from 'next/link';
import { getCartCount } from '@/lib/cart/service';
import { waLink, waQuestion } from '@/lib/whatsapp';

/**
 * Header fijo de 64px (§5): papel al 92% con blur suave, wordmark en
 * display, navegación en mono pequeña, carrito como número.
 * Lo usan los layouts de tienda y de compra: el comprador no sale del sitio.
 */
export async function StoreHeader() {
  const cartCount = await getCartCount();
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[var(--paper)]/92 backdrop-blur-sm border-b border-[var(--line)]">
      <div className="container-lumen h-full flex items-center justify-between gap-[var(--space-4)]">
        <Link href="/" className="font-display text-2xl font-semibold tracking-[-0.02em]">
          NOMAHOME
        </Link>

        <nav
          aria-label="Principal"
          className="hidden md:flex items-center gap-[var(--space-5)] font-mono text-[13px] uppercase tracking-[0.08em]"
        >
          <Link href="/categoria/muebles" className="hover:underline underline-offset-4">Piezas</Link>
          <Link href="/categoria/tecnologia-del-hogar" className="hover:underline underline-offset-4">Tecnología</Link>
          <Link href="/#oficio" className="hover:underline underline-offset-4">Oficio</Link>
          <Link href="/resenas" className="hover:underline underline-offset-4">Reseñas</Link>
        </nav>

        <div className="flex items-center gap-[var(--space-4)]">
          <Link
            href="/buscar"
            aria-label="Buscar en el catálogo"
            className="font-mono text-sm hover:underline underline-offset-4"
          >
            Buscar
          </Link>
          <Link
            href="/carrito"
            className="font-mono text-sm font-semibold border border-[var(--ink)] rounded-[var(--radius-m)] px-[var(--space-3)] py-[6px] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
          >
            Carrito
            <span className="ml-2 text-[var(--brass-2)]" data-testid="cart-count">{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer editorial (§5): taller en Morelia, horarios, WhatsApp y legales.
 * Sin columnas de "solutions / company / resources".
 */
export function StoreFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--paper-2)]">
      <div className="container-lumen py-[var(--space-7)]">
        <div className="grid grid-cols-12 gap-y-[var(--space-6)] gap-x-[var(--space-5)]">
          <div className="col-span-12 md:col-span-4">
            <p className="font-display text-xl mb-[var(--space-3)]">El taller</p>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              Morelia, Michoacán
              <br />
              Lunes a viernes, 10–18 h · Sábados 10–14 h
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="font-display text-xl mb-[var(--space-3)]">Hablemos</p>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              <a
                href={waLink(waQuestion())}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 decoration-[var(--brass)]"
              >
                WhatsApp del taller
              </a>
              <br />
              <a href="mailto:hola@nomahome.us" className="underline underline-offset-4 decoration-[var(--brass)]">
                hola@nomahome.us
              </a>
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="font-display text-xl mb-[var(--space-3)]">Del pedido</p>
            <nav className="text-sm text-[var(--ink-soft)] leading-relaxed" aria-label="Legales">
              <p><Link href="/envios" className="underline underline-offset-4">Envíos</Link></p>
              <p><Link href="/devoluciones" className="underline underline-offset-4">Devoluciones</Link></p>
              <p><Link href="/privacidad" className="underline underline-offset-4">Privacidad</Link></p>
              <p><Link href="/terminos" className="underline underline-offset-4">Términos</Link></p>
            </nav>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="font-display text-xl mb-[var(--space-3)]">Catálogo</p>
            <nav className="text-sm text-[var(--ink-soft)] leading-relaxed" aria-label="Catálogo">
              <p><Link href="/categoria/muebles" className="underline underline-offset-4">Muebles</Link></p>
              <p><Link href="/categoria/iluminacion" className="underline underline-offset-4">Iluminación</Link></p>
              <p><Link href="/categoria/tecnologia-del-hogar" className="underline underline-offset-4">Tecnología</Link></p>
              <p><Link href="/resenas" className="underline underline-offset-4">Reseñas</Link></p>
            </nav>
          </div>
        </div>
        <div className="mt-[var(--space-6)] pt-[var(--space-4)] border-t border-[var(--line)] flex flex-wrap gap-[var(--space-4)] justify-between text-xs text-[var(--ink-soft)] font-mono uppercase tracking-[0.08em]">
          <p>© {new Date().getFullYear()} NOMAHOME · Hecho en Morelia</p>
          <p>Piezas de taller, no de catálogo ajeno</p>
        </div>
      </div>
    </footer>
  );
}
