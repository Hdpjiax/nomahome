import { notFound } from 'next/navigation';
import { splitIva, formatMXN } from '@/lib/money';
import PriceTag from '@/components/store/PriceTag';
import EmptyState from '@/components/store/EmptyState';
import SheetDemo from '@/components/store/SheetDemo';

/**
 * /design-system — solo en desarrollo (§5). Si esta página se ve genérica,
 * el resto también lo está: es el espejo del sistema Lumen Editorial.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const ink = { splitIva };
  const price = 2_290_000;

  const colors: { token: string; value: string; use: string }[] = [
    { token: '--ink', value: '#1c1712', use: 'Tinta · texto y botones primarios' },
    { token: '--ink-soft', value: '#4a433c', use: 'Tinta suave · texto de apoyo' },
    { token: '--paper', value: '#f3eee6', use: 'Papel · fondo' },
    { token: '--paper-2', value: '#e7e0d4', use: 'Papel 2 · bloques de apoyo' },
    { token: '--stone', value: '#d8cfc2', use: 'Piedra · superficies de material' },
    { token: '--brass', value: '#8d6840', use: 'Latón · filete de 4px, acento' },
    { token: '--brass-2', value: '#c4a27a', use: 'Latón claro · subrayados' },
    { token: '--clay', value: '#9c4630', use: 'Arcilla · textiles y alertas suaves' },
    { token: '--pine', value: '#243f34', use: 'Pino · verde de taller' },
    { token: '--danger', value: '#8e2f24', use: 'Peligro · errores de cobro' },
  ];

  return (
    <div className="container-lumen py-[var(--space-7)] pb-[var(--space-8)]">
      <header className="mb-[var(--space-7)] border-b border-[var(--line)] pb-[var(--space-5)]">
        <p className="text-catalog mb-[var(--space-3)]">Lumen Editorial · sistema interno</p>
        <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-[-0.03em] leading-[0.95]">
          Un catálogo impreso puesto en pantalla.
        </h1>
        <p className="mt-[var(--space-4)] max-w-xl text-[var(--ink-soft)] leading-relaxed">
          Mucho papel, poca interfaz. Fotografía o materia a sangre, números de
          pieza como en una ficha de taller. Solo en desarrollo.
        </p>
      </header>

      {/* Color */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Color</h2>
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-[var(--space-3)]">
          {colors.map((c) => (
            <li key={c.token} className="flex flex-col gap-2">
              <div
                className="aspect-[4/3] rounded-[var(--radius-m)] border border-[var(--line)]"
                style={{ backgroundColor: c.value }}
              />
              <p className="font-mono text-xs">{c.token}</p>
              <p className="text-[11px] text-[var(--ink-soft)]">{c.use}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tipografía */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Tipografía</h2>
        <div className="grid grid-cols-12 gap-y-[var(--space-5)] gap-x-[var(--space-5)]">
          <p className="col-span-12 md:col-span-7 font-display text-5xl md:text-7xl leading-[0.92] tracking-[-0.03em]">
            Fraunces aguanta la lámpara y la conversación.
          </p>
          <div className="col-span-12 md:col-span-5 text-sm text-[var(--ink-soft)] leading-relaxed">
            <p className="font-ui">Schibsted Grotesk — texto de interfaz, tuteo, frases cortas.</p>
            <p className="font-mono mt-[var(--space-2)]">IBM Plex Mono — CL-SOF-220 · números de pieza, datos, medidas.</p>
          </div>
        </div>
      </section>

      {/* Botones */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Botones</h2>
        <div className="flex flex-wrap items-center gap-[var(--space-4)]">
          <button className="btn-primary">Agregar al carrito</button>
          <button className="btn-secondary">Elegir rápido</button>
          <button className="btn-primary btn-disabled" disabled>
            Avisar al taller
          </button>
          <a className="font-mono text-sm underline underline-offset-4 decoration-[var(--brass)]" href="#sheet">
            Enlace de texto
          </a>
        </div>
      </section>

      {/* Swatch */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Swatch de color</h2>
        <ul className="flex flex-wrap gap-[var(--space-3)]">
          {[
            { name: 'Arena', hex: '#D8CFC2' },
            { name: 'Tinta', hex: '#1C1712' },
            { name: 'Pino', hex: '#243F34' },
            { name: 'Roble', hex: '#A98D6B' },
            { name: 'Arcilla', hex: '#9C4630' },
          ].map((c) => (
            <li key={c.name} className="flex items-center gap-[var(--space-2)] border border-[var(--line)] rounded-[var(--radius-s)] px-[var(--space-2)] py-1">
              <span
                aria-hidden
                className="w-4 h-4 rounded-[2px] border border-[var(--line)]"
                style={{ backgroundColor: c.hex }}
              />
              <span className="font-mono text-xs">{c.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Sheet */}
      <section id="sheet" className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Sheet</h2>
        <p className="text-sm text-[var(--ink-soft)] mb-[var(--space-3)] max-w-md">
          En escritorio entra desde la derecha en 420 ms sobre tinta al 28%.
          En móvil sube desde abajo a 92dvh. Respeta reduced motion.
        </p>
        <SheetDemo />
      </section>

      {/* Ficha + precio con IVA */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Precio con IVA desglosado</h2>
        <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-5)] max-w-md">
          <p className="text-catalog mb-[var(--space-2)]">CL-SOF-220</p>
          <p className="font-display text-2xl mb-[var(--space-3)]">Sofá Norte 220</p>
          <PriceTag priceCents={price} size="lg" withIva />
          <dl className="mt-[var(--space-4)] pt-[var(--space-3)] border-t border-[var(--line)] font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">Subtotal</dt>
              <dd>{formatMXN(ink.splitIva(price).subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--ink-soft)]">IVA 16% incluido</dt>
              <dd>{formatMXN(ink.splitIva(price).taxCents)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total del título</dt>
              <dd>{formatMXN(price)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Estado vacío del carrito */}
      <section className="mb-[var(--space-7)]">
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Estado vacío del carrito</h2>
        <EmptyState
          title="Tu carrito está en silencio."
          note="Cuando agregues una pieza, aparece aquí con su foto, su color y la medida del paquete."
        />
      </section>

      {/* Ficha de catálogo */}
      <section>
        <h2 className="font-display text-2xl mb-[var(--space-4)]">Celda de catálogo</h2>
        <p className="text-sm text-[var(--ink-soft)] max-w-md mb-[var(--space-4)]">
          Imagen 4:5, número, nombre, material, precio. La separación es el
          papel: sin borde gris, sin sombra, sin píldora NEW. El hover de
          escritorio escala 1.03 en 700 ms y nada más.
        </p>
        <p className="text-catalog">Ver PieceCard en /categoria/muebles — es la misma celda.</p>
      </section>
    </div>
  );
}
