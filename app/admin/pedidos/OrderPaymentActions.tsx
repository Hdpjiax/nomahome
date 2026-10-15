'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmSpeiPaymentAction } from '@/lib/checkout/actions';
import { markPaymentReviewAction } from '@/lib/invoicing/actions';

/**
 * Acciones de pago del taller sobre un pedido por cobrar:
 * confirmar la transferencia vista en el banco (idempotente, con bitácora)
 * o marcar en revisión (que NO es pagar). Jamás se edita el monto.
 */
export default function OrderPaymentActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <button
        type="button"
        className="btn-primary text-[11px] px-2 py-1"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await confirmSpeiPaymentAction(orderId);
            setMessage(result.message);
            router.refresh();
          })
        }
      >
        Vi la transferencia
      </button>
      <button
        type="button"
        className="btn-secondary text-[11px] px-2 py-1"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await markPaymentReviewAction(orderId);
            setMessage(result.status === 'ok' ? result.message : (result.status === 'error' ? result.message : ''));
            router.refresh();
          })
        }
      >
        Revisión
      </button>
      {message ? <span className="text-[10px] text-[var(--ink-soft)]">{message}</span> : null}
    </div>
  );
}
