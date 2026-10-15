import Link from 'next/link';

function StoreHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[var(--paper)]/92 backdrop-blur-sm border-b border-[var(--line)]">
      <div className="container-lumen h-full flex items-center justify-between">
        <Link href="/" className="text-2xl font-display font-semibold">NOMAHOME</Link>
        <nav className="hidden md:flex gap-8 font-mono text-sm">
          <Link href="/categoria/muebles">Piezas</Link>
          <Link href="/categoria/tecnologia">Tecnología</Link>
          <Link href="/categoria/oficio">Oficio</Link>
          <Link href="/resenas">Reseñas</Link>
        </nav>
        <Link href="/carrito" className="font-mono text-sm font-semibold">Carrito</Link>
      </div>
    </header>
  );
}

function StoreFooter() {
  'use client';
  const year = 2026; // Static for prerender; update as needed
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--paper-2)]">
      <div className="container-lumen py-[var(--space-8)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-6)] mb-[var(--space-6)]">
          <div>
            <h4 className="font-display text-lg mb-3">Taller</h4>
            <p className="text-sm text-[var(--ink-soft)]">
              Morelia, Michoacán<br/>
              Lunes a viernes 10–18 h<br/>
              Sábados 10–14 h
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Contacto</h4>
            <p className="text-sm text-[var(--ink-soft)]">
              <a href="https://wa.me/5215539042880" className="underline">WhatsApp</a><br/>
              <a href="mailto:hola@nomahome.us" className="underline">hola@nomahome.us</a>
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg mb-3">Legal</h4>
            <p className="text-sm text-[var(--ink-soft)]">
              <Link href="/privacidad" className="underline">Privacidad</Link><br/>
              <Link href="/terminos" className="underline">Términos</Link><br/>
              <Link href="/devoluciones" className="underline">Devoluciones</Link>
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--line)] pt-[var(--space-4)] text-xs text-[var(--ink-soft)] text-center">
          © {year} NOMAHOME
        </div>
      </div>
    </footer>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <StoreHeader />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}
