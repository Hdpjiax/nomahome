'use client';

import { useState } from 'react';
import Sheet from './Sheet';
import PriceTag from './PriceTag';

/** Demo del sheet para /design-system (solo desarrollo). */
export default function SheetDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        Abrir agregado rápido
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Sofá Norte 220"
        catalogNumber="CL-SOF-220"
      >
        <div className="flex flex-col gap-[var(--space-4)]">
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
            Tres plazas de asiento profundo para la siesta de las cinco.
            Estructura de parota seca, resortes atados a mano.
          </p>
          <div className="flex flex-wrap gap-[var(--space-2)] font-mono text-xs">
            {['Arena', 'Tinta', 'Pino'].map((c, i) => (
              <span
                key={c}
                className={`border px-[var(--space-2)] py-1 rounded-[var(--radius-s)] ${
                  i === 0 ? 'border-[var(--ink)]' : 'border-[var(--line)]'
                }`}
              >
                {c}
              </span>
            ))}
          </div>
          <PriceTag priceCents={2_290_000} size="lg" withIva />
          <button type="button" className="btn-primary" onClick={() => setOpen(false)}>
            Agregar al carrito
          </button>
        </div>
      </Sheet>
    </>
  );
}
