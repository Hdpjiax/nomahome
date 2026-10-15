/**
 * Estado vacío editorial: una frase de taller, no una ilustración de caja
 * abierta de kit (INSTRUCCION.md §8 categoría).
 */
export default function EmptyState({
  title,
  note,
  action,
}: {
  title: string;
  note: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-t border-b border-[var(--line)] py-[var(--space-7)]">
      <p className="text-catalog mb-[var(--space-3)]">En silencio</p>
      <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-[-0.02em] max-w-2xl">
        {title}
      </h2>
      <p className="mt-[var(--space-4)] text-[var(--ink-soft)] max-w-xl leading-relaxed">
        {note}
      </p>
      {action ? <div className="mt-[var(--space-5)]">{action}</div> : null}
    </div>
  );
}
