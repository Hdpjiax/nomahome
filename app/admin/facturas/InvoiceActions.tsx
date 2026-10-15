'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelInvoiceAction, resendInvoiceAction } from '@/lib/invoicing/actions';

/** Reenviar y cancelar CFDI (§8 admin facturas). */
export default function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {status === 'stamped' ? (
        <>
          <button
            type="button"
            className="btn-secondary text-[11px] px-2 py-1"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await resendInvoiceAction(invoiceId);
                setMessage(result.status === 'ok' ? 'Reenviada.' : (result.status === 'error' ? result.message : ''));
                router.refresh();
              })
            }
          >
            Reenviar
          </button>
          <button
            type="button"
            className="font-mono text-[11px] text-[var(--danger)] underline underline-offset-4"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await cancelInvoiceAction(invoiceId);
                setMessage(result.status === 'ok' ? 'Cancelada.' : (result.status === 'error' ? result.message : ''));
                router.refresh();
              })
            }
          >
            Cancelar CFDI
          </button>
        </>
      ) : (
        <span className="text-[10px] text-[var(--ink-soft)]">—</span>
      )}
      {message ? <span className="text-[10px] text-[var(--ink-soft)]">{message}</span> : null}
    </div>
  );
}
