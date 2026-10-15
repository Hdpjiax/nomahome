'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveCategoryAction,
  reorderCategoryAction,
  moveProductCategoryAction,
  type AdminState,
} from '@/lib/admin/actions';

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-2)] py-[6px] text-sm focus:border-[var(--ink)] outline-none font-mono';
const label = 'block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-1';

function Note({ state }: { state: AdminState | null }) {
  if (!state || state.status === 'idle') return null;
  return (
    <p aria-live="polite" className={`text-xs mt-2 ${state.status === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--danger)]'}`}>
      {state.message}
    </p>
  );
}

/** Mover producto de categoría: acción EXPLÍPITA con bitácora (§6 admin). */
function MoveProduct({
  products,
  categories,
}: {
  products: { id: string; label: string; current: string[] }[];
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [toSlug, setToSlug] = useState(categories[0]?.slug ?? '');
  const [removeCurrent, setRemoveCurrent] = useState(true);
  const [state, setState] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();

  const selected = products.find((p) => p.id === productId);

  return (
    <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
      <h2 className="font-display text-lg mb-[var(--space-3)]">Mover pieza de categoría</h2>
      <div className="flex flex-wrap items-end gap-[var(--space-3)]">
        <div className="min-w-56">
          <label className={label}>Pieza</label>
          <select className={field} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-40">
          <label className={label}>Hacia</label>
          <select className={field} value={toSlug} onChange={(e) => setToSlug(e.target.value)}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-ui pb-[6px]">
          <input type="checkbox" className="w-4 h-4 accent-[var(--brass)]" checked={removeCurrent}
            onChange={(e) => setRemoveCurrent(e.target.checked)} />
          Quitar de la actual ({selected?.current.join(', ') || '—'})
        </label>
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={pending || !productId}
          onClick={() =>
            start(async () => {
              const from = selected?.current[0];
              setState(
                await moveProductCategoryAction(
                  productId,
                  toSlug,
                  removeCurrent && from && from !== toSlug ? from : undefined
                )
              );
              router.refresh();
            })
          }
        >
          Mover
        </button>
      </div>
      <Note state={state} />
    </section>
  );
}

export default function CategoriesManager({
  categories,
  products,
}: {
  categories: { id: string; slug: string; name: string; description: string | null; count: number }[];
  products: { id: string; label: string; current: string[] }[];
}) {
  const router = useRouter();
  const [state, setState] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();
  const [newCat, setNewCat] = useState({ slug: '', name: '', description: '' });
  const [editing, setEditing] = useState<{ id: string; slug: string; name: string; description: string } | null>(null);

  return (
    <div className="container-lumen py-[var(--space-7)] flex flex-col gap-[var(--space-6)]">
      <header>
        <p className="text-catalog mb-[var(--space-2)]">Taller · taxonomía</p>
        <h1 className="font-display font-semibold text-4xl tracking-[-0.02em]">Categorías</h1>
      </header>

      <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
        <h2 className="font-display text-lg mb-[var(--space-3)]">Árbol de un nivel</h2>
        <ul className="divide-y divide-[var(--line)]">
          {categories.map((c, i) => (
            <li key={c.id} className="py-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
              <span className="flex flex-col gap-[2px]">
                <button type="button" aria-label={`Subir ${c.name}`} className="font-mono text-xs disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => start(async () => { await reorderCategoryAction(c.id, -1); router.refresh(); })}>▲</button>
                <button type="button" aria-label={`Bajar ${c.name}`} className="font-mono text-xs disabled:opacity-30"
                  disabled={i === categories.length - 1}
                  onClick={() => start(async () => { await reorderCategoryAction(c.id, 1); router.refresh(); })}>▼</button>
              </span>
              <span className="font-mono text-sm w-44">{c.slug}</span>
              <span className="font-display text-base">{c.name}</span>
              <span className="font-mono text-xs text-[var(--ink-soft)]">{c.count} piezas</span>
              <button type="button" className="ml-auto font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
                onClick={() => setEditing({ id: c.id, slug: c.slug, name: c.name, description: c.description ?? '' })}>
                editar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {editing ? (
        <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
          <h2 className="font-display text-lg mb-[var(--space-3)]">Editar “{editing.name}”</h2>
          <div className="flex flex-wrap items-end gap-[var(--space-3)]">
            <div>
              <label className={label}>Slug</label>
              <input className={`${field} w-44`} value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            </div>
            <div>
              <label className={label}>Nombre</label>
              <input className={`${field} w-44`} value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="min-w-56 flex-1">
              <label className={label}>Descripción</label>
              <input className={field} value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <button type="button" className="btn-primary text-xs" disabled={pending}
              onClick={() => start(async () => {
                const result = await saveCategoryAction(editing.id, editing.slug, editing.name, editing.description);
                setState(result);
                if (result.status === 'ok') { setEditing(null); router.refresh(); }
              })}>
              Guardar
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
          <Note state={state} />
        </section>
      ) : null}

      <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
        <h2 className="font-display text-lg mb-[var(--space-3)]">Nueva categoría</h2>
        <div className="flex flex-wrap items-end gap-[var(--space-3)]">
          <div>
            <label className={label}>Slug</label>
            <input className={`${field} w-44`} placeholder="temporada-2027" value={newCat.slug}
              onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
          </div>
          <div>
            <label className={label}>Nombre</label>
            <input className={`${field} w-44`} placeholder="Temporada 2027" value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          </div>
          <div className="min-w-56 flex-1">
            <label className={label}>Descripción</label>
            <input className={field} value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} />
          </div>
          <button type="button" className="btn-primary text-xs" disabled={pending || !newCat.slug || !newCat.name}
            onClick={() => start(async () => {
              const result = await saveCategoryAction(null, newCat.slug, newCat.name, newCat.description);
              setState(result);
              if (result.status === 'ok') {
                setNewCat({ slug: '', name: '', description: '' });
                router.refresh();
              }
            })}>
            Crear
          </button>
        </div>
        <Note state={state} />
      </section>

      <MoveProduct products={products} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
    </div>
  );
}
