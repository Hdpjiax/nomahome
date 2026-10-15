'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import type { CatalogColor, SortOrder } from '@/lib/catalog/types';

type FiltersPanelProps = {
  baseSlug: string;
  colors: CatalogColor[];
  materials: string[];
};

const ORDENES: { value: SortOrder; label: string }[] = [
  { value: 'reciente', label: 'Reciente' },
  { value: 'precio-asc', label: 'Precio ↑' },
  { value: 'precio-desc', label: 'Precio ↓' },
  { value: 'nombre', label: 'Nombre' },
];

/**
 * Filtros de categoría que viven en la URL (§8): color, material,
 * precio_min, precio_max y orden. Nada de estado local: compartir el
 * enlace comparte el filtro.
 */
export default function FiltersPanel({ baseSlug, colors, materials }: FiltersPanelProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = useCallback(
    (key: string) => params.get(key) ?? '',
    [params]
  );

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== 'reciente') next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `/categoria/${baseSlug}?${qs}` : `/categoria/${baseSlug}`, {
          scroll: false,
        });
      });
    },
    [params, router, baseSlug]
  );

  const activeCount =
    (current('color') ? 1 : 0) +
    (current('material') ? 1 : 0) +
    (current('precio_min') || current('precio_max') ? 1 : 0);

  return (
    <aside
      className={`font-mono text-sm transition-opacity ${pending ? 'opacity-60' : ''}`}
      aria-label="Filtros de la categoría"
    >
      <div className="flex items-baseline justify-between mb-[var(--space-4)]">
        <p className="text-catalog">Afinar la búsqueda</p>
        {activeCount > 0 ? (
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.08em] underline underline-offset-4 decoration-[var(--brass)]"
            onClick={() => startTransition(() => router.push(`/categoria/${baseSlug}`, { scroll: false }))}
          >
            Limpiar ({activeCount})
          </button>
        ) : null}
      </div>

      <fieldset className="mb-[var(--space-5)]">
        <legend className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-3)]">
          Color de taller
        </legend>
        <ul className="flex flex-wrap gap-[var(--space-2)]">
          {colors.map((c) => {
            const active = current('color') === c.name;
            return (
              <li key={c.name}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => push('color', active ? '' : c.name)}
                  className={`flex items-center gap-[var(--space-2)] border px-[var(--space-2)] py-1 rounded-[var(--radius-s)] text-xs ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                      : 'border-[var(--line)] hover:border-[var(--ink-soft)]'
                  }`}
                >
                  <span
                    aria-hidden
                    className="inline-block w-3 h-3 rounded-[2px] border border-[var(--line)]"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mb-[var(--space-5)]">
        <legend className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-3)]">
          Material
        </legend>
        <ul className="flex flex-col gap-[var(--space-1)]">
          {materials.map((m) => {
            const active = current('material') === m;
            return (
              <li key={m}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => push('material', active ? '' : m)}
                  className={`text-left text-xs leading-relaxed ${
                    active ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  {active ? '— ' : '· '}
                  {m}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mb-[var(--space-5)]">
        <legend className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-3)]">
          Precio (MXN, IVA incluido)
        </legend>
        <form
          className="flex items-center gap-[var(--space-2)]"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const min = (form.elements.namedItem('precio_min') as HTMLInputElement).value;
            const max = (form.elements.namedItem('precio_max') as HTMLInputElement).value;
            push('precio_min', min ? String(Math.round(Number(min) * 100)) : '');
            push('precio_max', max ? String(Math.round(Number(max) * 100)) : '');
          }}
        >
          <input
            name="precio_min"
            type="number"
            min="0"
            placeholder="Desde"
            defaultValue={current('precio_min') ? String(Number(current('precio_min')) / 100) : ''}
            className="w-24 border border-[var(--line)] bg-transparent px-2 py-1 rounded-[var(--radius-s)] text-xs"
          />
          <input
            name="precio_max"
            type="number"
            min="0"
            placeholder="Hasta"
            defaultValue={current('precio_max') ? String(Number(current('precio_max')) / 100) : ''}
            className="w-24 border border-[var(--line)] bg-transparent px-2 py-1 rounded-[var(--radius-s)] text-xs"
          />
          <button type="submit" className="btn-secondary text-xs px-[var(--space-2)] py-1">
            Afinar
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-3)]">
          Orden
        </legend>
        <ul className="flex flex-wrap gap-[var(--space-2)]">
          {ORDENES.map((o) => {
            const active = (current('orden') || 'reciente') === o.value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => push('orden', o.value)}
                  className={`border px-[var(--space-2)] py-1 rounded-[var(--radius-s)] text-xs ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                      : 'border-[var(--line)] hover:border-[var(--ink-soft)]'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </aside>
  );
}
