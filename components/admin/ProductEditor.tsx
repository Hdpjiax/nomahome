'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  saveProductAction,
  saveVariantAction,
  duplicateVariantAction,
  deleteVariantAction,
  uploadMediaAction,
  addMediaPathAction,
  moveMediaAction,
  deleteMediaAction,
  saveTabAction,
  reorderTabsAction,
  deleteTabAction,
  type AdminState,
} from '@/lib/admin/actions';
import { formatMXN } from '@/lib/money';

export type EditorVariant = {
  id: string;
  sku: string;
  colorId: string;
  material: string;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  published: boolean;
  media: { id: string; path: string; alt: string }[];
};

export type EditorProduct = {
  id: string | null;
  slug: string;
  sku: string;
  name: string;
  summary: string;
  description: string;
  videoUrl: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  categorySlugs: string[];
  variants: EditorVariant[];
  tabs: { id: string; title: string; body: string }[];
};

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-2)] py-[6px] text-sm focus:border-[var(--ink)] outline-none font-mono';
const label = 'block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-1';

function Note({ state }: { state: AdminState | null }) {
  if (!state || state.status === 'idle') return null;
  return (
    <p
      aria-live="polite"
      className={`text-xs mt-2 ${state.status === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--danger)]'}`}
    >
      {state.message}
    </p>
  );
}

/**
 * Editor de pieza (§8 admin): columnas de datos + previsualización.
 * Drag de pestañas y reorden de fotos persisten sort_order; cada mutación
 * pasa por acciones de servidor con rol admin y audit_logs.
 */
export default function ProductEditor({
  product,
  categories,
  colors,
}: {
  product: EditorProduct;
  categories: { slug: string; name: string }[];
  colors: { id: string; name: string; hex: string }[];
}) {
  const router = useRouter();
  const isNew = product.id === null;

  // ---- datos de la pieza -------------------------------------------------
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    summary: product.summary,
    description: product.description,
    videoUrl: product.videoUrl,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    published: product.published,
  });
  const [catSlugs, setCatSlugs] = useState<string[]>(product.categorySlugs);
  const [saveState, setSaveState] = useState<AdminState | null>(null);
  const [pendingSave, startSave] = useTransition();

  // ---- pestañas (drag + edición) ------------------------------------------
  const [tabs, setTabs] = useState(product.tabs);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [tabState, setTabState] = useState<AdminState | null>(null);
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTabBody, setNewTabBody] = useState('');

  const preview = useMemo(
    () => ({
      sku: form.sku || 'CL-NUEVO',
      name: form.name || 'Pieza sin nombre',
      price: product.variants[0]?.priceCents ?? 0,
      material: product.variants[0]?.material ?? 'Material de la pieza',
      image: product.variants[0]?.media[0]?.path,
      colors: product.variants.length,
    }),
    [form, product.variants]
  );

  function saveProduct() {
    startSave(async () => {
      const result = await saveProductAction(product.id, {
        ...form,
        summary: form.summary || '',
        description: form.description || '',
        videoUrl: form.videoUrl || '',
        seoTitle: form.seoTitle || '',
        seoDescription: form.seoDescription || '',
        categorySlugs: catSlugs,
      });
      setSaveState(result);
      if (result.status === 'ok' && result.productId && isNew) {
        router.push(`/admin/productos/${result.productId}`);
      } else if (result.status === 'ok') {
        router.refresh();
      }
    });
  }

  function persistOrder(from: number, to: number) {
    const next = [...tabs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setTabs(next);
    if (product.id) {
      startSave(async () => {
        setTabState(
          await reorderTabsAction(
            product.id as string,
            next.map((t) => t.id)
          )
        );
      });
    }
  }

  return (
    <div className="container-lumen py-[var(--space-7)] grid grid-cols-12 gap-x-[var(--space-6)] gap-y-[var(--space-6)]">
      {/* =================== Columna de datos =================== */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-[var(--space-6)]">
        <header className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
          <div>
            <p className="text-catalog mb-1">
              <Link href="/admin/productos" className="hover:underline">
                Productos
              </Link>{' '}
              / {isNew ? 'Nueva pieza' : product.sku}
            </p>
            <h1 className="font-display font-semibold text-3xl tracking-[-0.02em]">
              {isNew ? 'Crear pieza' : form.name}
            </h1>
          </div>
          {!isNew ? (
            <Link
              href={`/producto/${form.slug}`}
              className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
            >
              ver ficha ↗
            </Link>
          ) : null}
        </header>

        {/* Datos */}
        <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
          <h2 className="font-display text-lg mb-[var(--space-3)]">Datos de la pieza</h2>
          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="p-name">
                Nombre
              </label>
              <input
                id="p-name"
                className={field}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="p-slug">
                Slug (URL)
              </label>
              <input
                id="p-slug"
                className={field}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="p-sku">
                SKU padre
              </label>
              <input
                id="p-sku"
                className={field}
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end">
              <label className="flex items-center gap-2 text-sm font-ui pb-[6px]">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--brass)]"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Publicada en vitrina
              </label>
            </div>
            <div className="col-span-2">
              <label className={label} htmlFor="p-summary">
                Summary (frase de vitrina)
              </label>
              <textarea
                id="p-summary"
                rows={2}
                className={field}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className={label} htmlFor="p-desc">
                Descripción
              </label>
              <textarea
                id="p-desc"
                rows={4}
                className={field}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className={label} htmlFor="p-video">
                URL de video (opcional)
              </label>
              <input
                id="p-video"
                className={field}
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="p-seot">
                SEO title
              </label>
              <input
                id="p-seot"
                className={field}
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="p-seod">
                SEO description
              </label>
              <input
                id="p-seod"
                className={field}
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              />
            </div>
          </div>

          <fieldset className="mt-[var(--space-4)]">
            <legend className={label}>Categorías</legend>
            <div className="flex flex-wrap gap-x-[var(--space-4)] gap-y-2">
              {categories.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-sm font-ui">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--brass)]"
                    checked={catSlugs.includes(c.slug)}
                    onChange={(e) =>
                      setCatSlugs((prev) =>
                        e.target.checked ? [...prev, c.slug] : prev.filter((s) => s !== c.slug)
                      )
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="btn-primary text-sm mt-[var(--space-4)]"
            onClick={saveProduct}
            disabled={pendingSave}
          >
            {pendingSave ? 'Guardando…' : isNew ? 'Crear pieza' : 'Guardar datos'}
          </button>
          <Note state={saveState} />
        </section>

        {/* Variantes */}
        {!isNew ? (
          <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
            <h2 className="font-display text-lg mb-[var(--space-3)]">
              Variantes{' '}
              <span className="font-mono text-xs text-[var(--ink-soft)]">
                ({product.variants.length})
              </span>
            </h2>
            <div className="flex flex-col gap-[var(--space-4)]">
              {product.variants.map((v) => (
                <VariantCard key={v.id} variant={v} colors={colors} productId={product.id!} />
              ))}
            </div>
            <NewVariant productId={product.id!} colors={colors} onDone={() => router.refresh()} />
          </section>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            Crea la pieza para agregar variantes, fotos y pestañas.
          </p>
        )}

        {/* Pestañas */}
        {!isNew ? (
          <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
            <h2 className="font-display text-lg mb-[var(--space-2)]">Pestañas de la ficha</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-[var(--space-3)]">
              Arrastra para reordenar (o usa las flechas): el orden se persiste.
            </p>
            <ul className="flex flex-col gap-[var(--space-2)]">
              {tabs.map((t, i) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== i) persistOrder(dragIndex, i);
                    setDragIndex(null);
                  }}
                  className={`border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-3)] ${dragIndex === i ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-[var(--space-3)]">
                    <span className="font-mono text-[var(--ink-soft)] select-none" aria-hidden>
                      ⋮⋮
                    </span>
                    <TabEditor
                      productId={product.id!}
                      tab={t}
                      onDeleted={() => {
                        setTabs((prev) => prev.filter((x) => x.id !== t.id));
                        router.refresh();
                      }}
                    />
                    <span className="flex flex-col gap-[2px]">
                      <button
                        type="button"
                        aria-label="Subir pestaña"
                        className="font-mono text-xs hover:text-[var(--brass)] disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => persistOrder(i, i - 1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="Bajar pestaña"
                        className="font-mono text-xs hover:text-[var(--brass)] disabled:opacity-30"
                        disabled={i === tabs.length - 1}
                        onClick={() => persistOrder(i, i + 1)}
                      >
                        ▼
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <Note state={tabState} />
            <div className="mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--line)]">
              <p className={label}>Nueva pestaña</p>
              <input
                className={field}
                placeholder="Título (p. ej. Materiales y medidas)"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
              />
              <textarea
                className={`${field} mt-2`}
                rows={3}
                placeholder="Cuerpo de la pestaña"
                value={newTabBody}
                onChange={(e) => setNewTabBody(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-sm mt-2"
                onClick={() =>
                  startSave(async () => {
                    const result = await saveTabAction(null, product.id!, newTabTitle, newTabBody);
                    setTabState(result);
                    if (result.status === 'ok') {
                      setNewTabTitle('');
                      setNewTabBody('');
                      router.refresh();
                    }
                  })
                }
              >
                Agregar pestaña
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {/* =================== Previsualización =================== */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-20 border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)] bg-[var(--paper-2)]/40">
          <p className="text-catalog mb-[var(--space-3)]">Previsualización de vitrina</p>
          <div className="bg-[var(--paper)] rounded-[var(--radius-m)] p-[var(--space-4)]">
            {preview.image ? (
              <Image
                src={preview.image}
                alt={preview.name}
                width={400}
                height={500}
                className="w-full aspect-[4/5] object-cover rounded-[var(--radius-m)]"
              />
            ) : (
              <div className="w-full aspect-[4/5] rounded-[var(--radius-m)] bg-[var(--paper-2)] flex items-center justify-center">
                <span className="font-mono text-xs text-[var(--ink-soft)]">sin foto</span>
              </div>
            )}
            <p className="text-catalog mt-[var(--space-3)]">{preview.sku}</p>
            <p className="font-display text-xl mt-1">{preview.name}</p>
            <p className="text-xs text-[var(--ink-soft)] mt-1">{preview.material}</p>
            <p className="font-mono text-sm font-semibold mt-2">{formatMXN(preview.price)}</p>
            {preview.colors > 1 ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mt-1">
                {preview.colors} colores de taller
              </p>
            ) : null}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-[var(--space-3)] leading-relaxed">
            Así se ve la celda en listados. La ficha completa usa la misma materia con galería y
            pestañas.
          </p>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TabEditor({
  productId,
  tab,
  onDeleted,
}: {
  productId: string;
  tab: { id: string; title: string; body: string };
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(tab.title);
  const [body, setBody] = useState(tab.body);
  const [state, setState] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex-1">
      <div className="flex gap-[var(--space-2)]">
        <input
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título de pestaña"
        />
        <button
          type="button"
          className="btn-secondary text-xs shrink-0"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setState(await saveTabAction(tab.id, productId, title, body));
            })
          }
        >
          Guardar
        </button>
        <button
          type="button"
          className="font-mono text-xs text-[var(--danger)] shrink-0"
          onClick={() =>
            start(async () => {
              const result = await deleteTabAction(tab.id, productId);
              if (result.status === 'ok') onDeleted();
            })
          }
        >
          Quitar
        </button>
      </div>
      <textarea
        className={`${field} mt-2`}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Cuerpo de pestaña"
      />
      <Note state={state} />
    </div>
  );
}

function VariantCard({
  variant,
  colors,
  productId,
}: {
  variant: EditorVariant;
  colors: { id: string; name: string; hex: string }[];
  productId: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(variant);
  const [state, setState] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [newPath, setNewPath] = useState('');

  const colorName = colors.find((c) => c.id === v.colorId)?.name ?? '—';

  function save() {
    start(async () => {
      setState(
        await saveVariantAction(variant.id, productId, {
          sku: v.sku,
          colorId: v.colorId,
          material: v.material,
          widthCm: v.widthCm,
          depthCm: v.depthCm,
          heightCm: v.heightCm,
          weightKg: v.weightKg,
          priceCents: v.priceCents,
          compareAtCents: v.compareAtCents,
          stock: v.stock,
          published: v.published,
        })
      );
    });
  }

  return (
    <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-3)]">
      <div className="flex items-baseline justify-between gap-[var(--space-3)] mb-[var(--space-3)]">
        <p className="font-mono text-xs">
          {v.sku} · {colorName}
        </p>
        <div className="flex gap-[var(--space-2)] text-xs">
          <button
            type="button"
            className="font-mono underline underline-offset-4 decoration-[var(--brass)]"
            onClick={() =>
              start(async () => {
                setState(await duplicateVariantAction(variant.id));
                router.refresh();
              })
            }
          >
            duplicar
          </button>
          <button
            type="button"
            className="font-mono text-[var(--danger)] underline underline-offset-4"
            onClick={() =>
              start(async () => {
                setState(await deleteVariantAction(variant.id));
                router.refresh();
              })
            }
          >
            quitar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-[var(--space-2)]">
        <div className="col-span-1">
          <label className={label}>SKU</label>
          <input
            className={field}
            value={v.sku}
            onChange={(e) => setV({ ...v, sku: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Color</label>
          <select
            className={field}
            value={v.colorId}
            onChange={(e) => setV({ ...v, colorId: e.target.value })}
          >
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={label}>Material</label>
          <input
            className={field}
            value={v.material}
            onChange={(e) => setV({ ...v, material: e.target.value })}
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Ancho</label>
          <input
            className={field}
            type="number"
            value={v.widthCm ?? ''}
            onChange={(e) =>
              setV({ ...v, widthCm: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Fondo</label>
          <input
            className={field}
            type="number"
            value={v.depthCm ?? ''}
            onChange={(e) =>
              setV({ ...v, depthCm: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Alto</label>
          <input
            className={field}
            type="number"
            value={v.heightCm ?? ''}
            onChange={(e) =>
              setV({ ...v, heightCm: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Peso kg</label>
          <input
            className={field}
            type="number"
            step="0.1"
            value={v.weightKg ?? ''}
            onChange={(e) =>
              setV({ ...v, weightKg: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Centavos</label>
          <input
            className={field}
            type="number"
            value={v.priceCents}
            onChange={(e) => setV({ ...v, priceCents: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Comparar</label>
          <input
            className={field}
            type="number"
            value={v.compareAtCents ?? ''}
            onChange={(e) =>
              setV({ ...v, compareAtCents: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="col-span-1">
          <label className={label}>Stock</label>
          <input
            className={field}
            type="number"
            value={v.stock}
            onChange={(e) => setV({ ...v, stock: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-1 flex items-end pb-[4px]">
          <label className="flex items-center gap-1 text-xs font-ui">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[var(--brass)]"
              checked={v.published}
              onChange={(e) => setV({ ...v, published: e.target.checked })}
            />
            Publicada
          </label>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary text-xs mt-[var(--space-3)]"
        onClick={save}
        disabled={pending}
      >
        {pending ? 'Guardando…' : 'Guardar variante'}
      </button>
      <Note state={state} />

      {/* Media de la variante */}
      <div className="mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--line)]">
        <p className={label}>Fotos ({v.media.length}) — el orden se persiste</p>
        <ul className="flex flex-wrap gap-[var(--space-2)]">
          {v.media.map((m, i) => (
            <li key={m.id} className="relative">
              <Image
                src={m.path}
                alt={m.alt}
                width={96}
                height={120}
                className="w-16 h-20 object-cover rounded-[var(--radius-s)] border border-[var(--line)]"
              />
              <span className="absolute -top-2 -left-2 flex gap-[2px]">
                <button
                  type="button"
                  aria-label="Subir foto"
                  className="font-mono text-[10px] bg-[var(--paper)] border border-[var(--line)] rounded-[2px] px-[3px] disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() =>
                    startUpload(async () => {
                      await moveMediaAction(m.id, -1);
                      router.refresh();
                    })
                  }
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Bajar foto"
                  className="font-mono text-[10px] bg-[var(--paper)] border border-[var(--line)] rounded-[2px] px-[3px] disabled:opacity-30"
                  disabled={i === v.media.length - 1}
                  onClick={() =>
                    startUpload(async () => {
                      await moveMediaAction(m.id, 1);
                      router.refresh();
                    })
                  }
                >
                  ▼
                </button>
                <button
                  type="button"
                  aria-label="Quitar foto"
                  className="font-mono text-[10px] bg-[var(--paper)] border border-[var(--danger)] text-[var(--danger)] rounded-[2px] px-[3px]"
                  onClick={() =>
                    startUpload(async () => {
                      await deleteMediaAction(m.id);
                      router.refresh();
                    })
                  }
                >
                  ×
                </button>
              </span>
            </li>
          ))}
          {v.media.length === 0 ? (
            <li className="text-xs text-[var(--ink-soft)] font-ui">Sin fotos todavía.</li>
          ) : null}
        </ul>

        <div className="flex flex-wrap items-end gap-[var(--space-2)] mt-[var(--space-3)]">
          <div>
            <label className={label}>Subir imagen (máx. 5 MB)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
              className="text-xs font-ui"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                startUpload(async () => {
                  setState(await uploadMediaAction(variant.id, file, `${v.sku}`));
                  router.refresh();
                });
                e.target.value = '';
              }}
            />
          </div>
          <div>
            <label className={label}>…o registrar ruta del repo</label>
            <div className="flex gap-1">
              <input
                className={field}
                placeholder="/brand/seed/mi-pieza.svg"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-xs shrink-0"
                onClick={() =>
                  startUpload(async () => {
                    setState(
                      await addMediaPathAction(variant.id, newPath, `${v.sku} en ${colorName}`)
                    );
                    setNewPath('');
                    router.refresh();
                  })
                }
              >
                Agregar
              </button>
            </div>
          </div>
          {uploading ? <p className="text-xs font-mono text-[var(--ink-soft)]">subiendo…</p> : null}
        </div>
      </div>
    </div>
  );
}

function NewVariant({
  productId,
  colors,
  onDone,
}: {
  productId: string;
  colors: { id: string; name: string; hex: string }[];
  onDone: () => void;
}) {
  const [sku, setSku] = useState('');
  const [colorId, setColorId] = useState(colors[0]?.id ?? '');
  const [priceCents, setPriceCents] = useState(0);
  const [stock, setStock] = useState(0);
  const [material, setMaterial] = useState('');
  const [state, setState] = useState<AdminState | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--line)]">
      <p className={label}>Nueva variante</p>
      <div className="flex flex-wrap items-end gap-[var(--space-2)]">
        <input
          className={`${field} w-40`}
          placeholder="SKU (CL-XXX-YYY)"
          value={sku}
          onChange={(e) => setSku(e.target.value.toUpperCase())}
          aria-label="SKU de variante"
        />
        <select
          className={`${field} w-32`}
          value={colorId}
          onChange={(e) => setColorId(e.target.value)}
          aria-label="Color"
        >
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className={`${field} flex-1 min-w-40`}
          placeholder="Material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          aria-label="Material"
        />
        <input
          className={`${field} w-28`}
          type="number"
          placeholder="Centavos"
          value={priceCents || ''}
          onChange={(e) => setPriceCents(Number(e.target.value))}
          aria-label="Precio en centavos"
        />
        <input
          className={`${field} w-20`}
          type="number"
          placeholder="Stock"
          value={stock || ''}
          onChange={(e) => setStock(Number(e.target.value))}
          aria-label="Stock"
        />
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={pending || !sku || !colorId}
          onClick={() =>
            start(async () => {
              const result = await saveVariantAction(null, productId, {
                sku,
                colorId,
                material,
                widthCm: null,
                depthCm: null,
                heightCm: null,
                weightKg: null,
                priceCents,
                compareAtCents: null,
                stock,
                published: false,
              });
              setState(result);
              if (result.status === 'ok') onDone();
            })
          }
        >
          Agregar variante
        </button>
      </div>
      <Note state={state} />
    </div>
  );
}
