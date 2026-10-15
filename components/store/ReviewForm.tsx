'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReviewAction } from '@/lib/reviews/actions';

/**
 * Formulario de reseña de compra verificada. Estrellas dibujadas con la
 * paleta (latón), sin emojis amarillos (§5 anti-patrones).
 */
export default function ReviewForm({
  variantId,
  orderId,
  variantLabel,
}: {
  variantId: string;
  orderId: string;
  variantLabel: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<{ message: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await submitReviewAction(variantId, orderId, rating, title, body);
      if (result.status === 'ok') {
        setState({ message: result.message, ok: true });
        router.refresh();
      } else if (result.status === 'error') {
        setState({ message: result.message, ok: false });
      }
    });
  }

  const field =
    'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';

  return (
    <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
      <p className="text-catalog mb-[var(--space-2)]">{variantLabel}</p>
      <div className="flex gap-1 mb-[var(--space-3)]" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} de 5`}
            onClick={() => setRating(n)}
            className={`w-6 h-6 rotate-45 border transition-colors ${
              n <= rating
                ? 'border-[var(--brass)] bg-[var(--brass)]'
                : 'border-[var(--line)] bg-transparent hover:border-[var(--brass)]'
            }`}
          >
            <span className="sr-only">{n}</span>
          </button>
        ))}
      </div>
      <input
        className={`${field} mb-[var(--space-3)]`}
        placeholder="Título (opcional)"
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Título de la reseña"
      />
      <textarea
        className={`${field} mb-[var(--space-3)]`}
        placeholder="¿Cómo te va con la pieza? La madera, la tela, la luz…"
        rows={4}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Cuerpo de la reseña"
      />
      <p aria-live="polite" className="min-h-5 text-xs mb-[var(--space-3)]">
        {state ? (
          <span className={state.ok ? 'text-[var(--ok)]' : 'text-[var(--danger)]'}>
            {state.message}
          </span>
        ) : null}
      </p>
      <button type="button" className="btn-primary text-sm" onClick={submit} disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </div>
  );
}
