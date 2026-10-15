'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moveHomeBlockAction, saveHomeBlockAction, type AdminState } from '@/lib/admin/actions';

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-2)] py-[6px] text-sm focus:border-[var(--ink)] outline-none font-mono';

const KIND_LABEL: Record<string, string> = {
  opening: 'Apertura',
  categories: 'Materia',
  pieces: 'Piezas del mes',
  craft_note: 'Nota de oficio',
  contact: 'Contacto',
};

/** Reordenar bloques del home (§8 admin): el orden persiste sort_order. */
export default function HomeBlocksManager({
  blocks,
}: {
  blocks: { id: string; kind: string; title: string; body: string | null; published: boolean }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<AdminState | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    title: string;
    body: string;
    published: boolean;
  } | null>(null);

  return (
    <div className="container-lumen py-[var(--space-7)] flex flex-col gap-[var(--space-6)]">
      <header>
        <p className="text-catalog mb-[var(--space-2)]">Taller · portada</p>
        <h1 className="font-display font-semibold text-4xl tracking-[-0.02em]">Bloques del home</h1>
        <p className="mt-[var(--space-3)] text-sm text-[var(--ink-soft)] max-w-lg leading-relaxed">
          El orden de esta lista es el orden de la portada. Sube, baja o edita
          cada bloque; el cambio se ve al instante en la tienda.
        </p>
      </header>

      <ol className="border border-[var(--line)] rounded-[var(--radius-m)] divide-y divide-[var(--line)]">
        {blocks.map((b, i) => (
          <li key={b.id} className="p-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-3)]">
            <span className="font-mono text-[var(--ink-soft)] w-6">{i + 1}.</span>
            <span className="flex flex-col gap-[2px]">
              <button type="button" aria-label="Subir bloque" className="font-mono text-xs disabled:opacity-30"
                disabled={i === 0}
                onClick={() => start(async () => { await moveHomeBlockAction(b.id, -1); router.refresh(); })}>▲</button>
              <button type="button" aria-label="Bajar bloque" className="font-mono text-xs disabled:opacity-30"
                disabled={i === blocks.length - 1}
                onClick={() => start(async () => { await moveHomeBlockAction(b.id, 1); router.refresh(); })}>▼</button>
            </span>
            <div className="flex-1 min-w-56">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                {KIND_LABEL[b.kind] ?? b.kind} {b.published ? '' : '· oculto'}
              </p>
              <p className="font-display text-base leading-tight">{b.title}</p>
              {b.body ? (
                <p className="text-xs text-[var(--ink-soft)] truncate max-w-xl">{b.body}</p>
              ) : null}
            </div>
            <button type="button" className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
              onClick={() => setEditing({ id: b.id, title: b.title, body: b.body ?? '', published: b.published })}>
              editar
            </button>
          </li>
        ))}
      </ol>

      {editing ? (
        <section className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
          <h2 className="font-display text-lg mb-[var(--space-3)]">Editar bloque</h2>
          <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-1">
            Título
          </label>
          <input className={field} value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-1 mt-3">
            Cuerpo
          </label>
          <textarea className={field} rows={4} value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm mt-3">
            <input type="checkbox" className="w-4 h-4 accent-[var(--brass)]"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            Publicado
          </label>
          <div className="flex gap-[var(--space-3)] mt-4">
            <button type="button" className="btn-primary text-sm" disabled={pending}
              onClick={() => start(async () => {
                const result = await saveHomeBlockAction(editing.id, editing.title, editing.body, editing.published);
                setState(result);
                if (result.status === 'ok') { setEditing(null); router.refresh(); }
              })}>
              Guardar
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </section>
      ) : null}

      {state && state.status !== 'idle' ? (
        <p aria-live="polite" className={`text-xs ${state.status === 'ok' ? 'text-[var(--ok)]' : 'text-[var(--danger)]'}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
