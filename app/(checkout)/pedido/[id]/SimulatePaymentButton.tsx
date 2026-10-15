'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { simulatePaymentAction } from '@/lib/checkout/actions';

/**
 * Simulación de pago aprobado — SOLO existe en PAYMENTS_MODE=sandbox.
 * Pasa por la firma HMAC del webhook: ejercita el mismo camino que un
 * evento real. En producción este botón no se renderiza.
 */
export default function SimulatePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="border border-dashed border-[var(--brass)] rounded-[var(--radius-m)] p-[var(--space-4)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--brass)] mb-[var(--space-2)]">
        Modo pruebas (sandbox)
      </p>
      <p className="text-xs text-[var(--ink-soft)] mb-[var(--space-3)] leading-relaxed">
        En sandbox puedes aprobar el pago aquí para probar todo el flujo:
        el evento se firma con HMAC y pasa por el webhook como en producción.
      </p>
      <button
        type="button"
        className="btn-secondary text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await simulatePaymentAction(orderId);
            setMessage(result.message);
            router.refresh();
          })
        }
      >
        {pending ? 'Aplicando…' : 'Simular pago aprobado'}
      </button>
      <p aria-live="polite" className="mt-[var(--space-2)] min-h-4 text-xs">
        {message ? <span className="text-[var(--ink-soft)]">{message}</span> : null}
      </p>
    </div>
  );
}
