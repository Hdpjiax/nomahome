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
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-[-0.02em] hover:opacity-80 transition-opacity"
          >
            NOMAHOME
          </Link>
          <span className="hidden xl:inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brass)] border-l border-[var(--line)] pl-3">
            Morelia · Taller & Estudio
          </span>
        </div>

        <nav
          aria-label="Principal"
          className="hidden md:flex items-center gap-[var(--space-5)] font-mono text-[12px] uppercase tracking-[0.08em]"
        >
          <Link
            href="/#coleccion-destacada"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Destacados
          </Link>
          <Link
            href="/categoria/muebles"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Piezas
          </Link>
          <Link
            href="/categoria/iluminacion"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Iluminación
          </Link>
          <Link
            href="/categoria/tecnologia-del-hogar"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Tecnología
          </Link>
          <Link
            href="/#espacios-noma"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Espacios
          </Link>
          <Link
            href="/resenas"
            className="hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Reseñas
          </Link>
        </nav>

        <div className="flex items-center gap-[var(--space-3)] sm:gap-[var(--space-4)]">
          <Link
            href="/buscar"
            aria-label="Buscar en el catálogo"
            className="font-mono text-xs sm:text-sm uppercase tracking-[0.06em] hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Buscar
          </Link>
          <Link
            href="/cuenta"
            className="hidden sm:inline-block font-mono text-xs uppercase tracking-[0.06em] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline underline-offset-4 decoration-[var(--brass)]"
          >
            Cuenta
          </Link>
          <Link
            href="/carrito"
            className="font-mono text-sm font-semibold border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] rounded-[var(--radius-m)] px-[var(--space-3)] py-[6px] hover:bg-[var(--ink-soft)] transition-colors"
          >
            Carrito
            <span className="ml-2 text-[var(--brass-2)]" data-testid="cart-count">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer editorial de lujo (§5): taller en Morelia, horarios, WhatsApp,
 * garantías de envío SPEI / CFDI 4.0 y legales.
 */
export function StoreFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--paper-2)]">
      {/* Franja superior de garantías de taller */}
      <div className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="container-lumen py-[var(--space-5)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-4)] font-mono text-xs">
          <div className="border-l-2 border-[var(--brass)] pl-3">
            <p className="uppercase tracking-[0.08em] font-semibold text-[var(--ink)]">
              01 · Ebanistería de Origen
            </p>
            <p className="text-[var(--ink-soft)] mt-1">
              Parota estufada, roble blanco de 4 cm, latón cepillado y lino de 680 g/m².
            </p>
          </div>
          <div className="border-l-2 border-[var(--brass)] pl-3">
            <p className="uppercase tracking-[0.08em] font-semibold text-[var(--ink)]">
              02 · Envío Asegurado
            </p>
            <p className="text-[var(--ink-soft)] mt-1">
              Sin costo en todo México desde $15,000 MXN ($249 en Michoacán).
            </p>
          </div>
          <div className="border-l-2 border-[var(--brass)] pl-3">
            <p className="uppercase tracking-[0.08em] font-semibold text-[var(--ink)]">
              03 · Cobro Directo SPEI
            </p>
            <p className="text-[var(--ink-soft)] mt-1">
              Transferencia directa a la CLABE del taller. Jamás capturamos tarjetas.
            </p>
          </div>
          <div className="border-l-2 border-[var(--brass)] pl-3">
            <p className="uppercase tracking-[0.08em] font-semibold text-[var(--ink)]">
              04 · Factura CFDI 4.0
            </p>
            <p className="text-[var(--ink-soft)] mt-1">
              IVA 16% incluido en vitrina y timbrado fiscal inmediato desde tu cuenta.
            </p>
          </div>
        </div>
      </div>

      <div className="container-lumen py-[var(--space-7)]">
        <div className="grid grid-cols-12 gap-y-[var(--space-6)] gap-x-[var(--space-5)]">
          <div className="col-span-12 md:col-span-4">
            <p className="text-catalog mb-2">Casa de Diseño & Ebanistería</p>
            <p className="font-display text-3xl mb-[var(--space-3)]">NOMAHOME</p>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed max-w-sm">
              Taller y sala de exhibición en Morelia, Michoacán.
              <br />
              Lunes a viernes, 10:00–18:00 h · Sábados 10:00–14:00 h
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="font-display text-xl mb-[var(--space-3)]">Concierge & Taller</p>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              <a
                href={waLink(waQuestion())}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 decoration-[var(--brass)] hover:text-[var(--ink)]"
              >
                WhatsApp directo del taller
              </a>
              <br />
              <a
                href="mailto:hola@nomahome.us"
                className="underline underline-offset-4 decoration-[var(--brass)] hover:text-[var(--ink)]"
              >
                hola@nomahome.us
              </a>
              <br />
              <Link
                href="/contacto"
                className="underline underline-offset-4 decoration-[var(--brass)] hover:text-[var(--ink)]"
              >
                Agendar cita o consulta de medida
              </Link>
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="font-display text-xl mb-[var(--space-3)]">Del pedido y cuenta</p>
            <nav
              className="text-sm text-[var(--ink-soft)] leading-relaxed space-y-1"
              aria-label="Legales"
            >
              <p>
                <Link href="/cuenta" className="underline underline-offset-4">
                  Mi cuenta y pedidos
                </Link>
              </p>
              <p>
                <Link href="/cuenta/facturacion" className="underline underline-offset-4">
                  Facturación CFDI 4.0
                </Link>
              </p>
              <p>
                <Link href="/envios" className="underline underline-offset-4">
                  Envíos y tiempos de obra
                </Link>
              </p>
              <p>
                <Link href="/devoluciones" className="underline underline-offset-4">
                  Garantía y devoluciones (7 días)
                </Link>
              </p>
              <p>
                <Link href="/privacidad" className="underline underline-offset-4">
                  Aviso de privacidad
                </Link>
              </p>
              <p>
                <Link href="/terminos" className="underline underline-offset-4">
                  Términos del taller
                </Link>
              </p>
            </nav>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="font-display text-xl mb-[var(--space-3)]">Colecciones</p>
            <nav
              className="text-sm text-[var(--ink-soft)] leading-relaxed space-y-1"
              aria-label="Catálogo"
            >
              <p>
                <Link href="/categoria/muebles" className="underline underline-offset-4">
                  Muebles
                </Link>
              </p>
              <p>
                <Link href="/categoria/iluminacion" className="underline underline-offset-4">
                  Iluminación 2700K
                </Link>
              </p>
              <p>
                <Link
                  href="/categoria/tecnologia-del-hogar"
                  className="underline underline-offset-4"
                >
                  Tecnología del hogar
                </Link>
              </p>
              <p>
                <Link href="/categoria/textiles" className="underline underline-offset-4">
                  Textiles bouclé
                </Link>
              </p>
              <p>
                <Link href="/resenas" className="underline underline-offset-4">
                  Reseñas verificadas
                </Link>
              </p>
            </nav>
          </div>
        </div>
        <div className="mt-[var(--space-6)] pt-[var(--space-4)] border-t border-[var(--line)] flex flex-wrap gap-[var(--space-4)] justify-between text-xs text-[var(--ink-soft)] font-mono uppercase tracking-[0.08em]">
          <p>© {new Date().getFullYear()} NOMAHOME · Hecho en Morelia, Michoacán</p>
          <p>Ebanistería arquitectónica, luz cálida y sonido de estudio</p>
        </div>
      </div>
    </footer>
  );
}
