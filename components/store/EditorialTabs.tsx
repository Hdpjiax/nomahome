'use client';

import { useId, useState } from 'react';

/**
 * Pestañas editoriales de la ficha, en el orden que fijó el admin.
 * role=tablist/tab/tabpanel con teclado (§9 accesibilidad).
 */
export default function EditorialTabs({
  tabs,
}: {
  tabs: { id: string; title: string; body: string }[];
}) {
  const [active, setActive] = useState(0);
  const base = useId();

  if (tabs.length === 0) return null;

  return (
    <div>
      <div role="tablist" aria-label="Detalle de la pieza" className="flex flex-wrap gap-x-[var(--space-5)] gap-y-2 border-b border-[var(--line)]">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') setActive((i + 1) % tabs.length);
              if (e.key === 'ArrowLeft') setActive((i - 1 + tabs.length) % tabs.length);
            }}
            className={`font-mono text-xs uppercase tracking-[0.08em] pb-[var(--space-2)] -mb-px border-b-2 transition-colors ${
              active === i
                ? 'border-[var(--brass)] text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          hidden={active !== i}
          className="pt-[var(--space-4)] text-sm text-[var(--ink-soft)] leading-relaxed max-w-2xl whitespace-pre-line"
        >
          {t.body}
        </div>
      ))}
    </div>
  );
}
