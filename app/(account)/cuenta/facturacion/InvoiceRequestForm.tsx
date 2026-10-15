'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestInvoiceAction, type InvoiceState } from '@/lib/invoicing/actions';

const field =
  'w-full border border-[var(--line)] bg-[var(--paper)] rounded-[var(--radius-s)] px-[var(--space-3)] py-[var(--space-2)] text-sm focus:border-[var(--ink)] outline-none';
const label = 'block font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] mb-[var(--space-2)]';

export default function InvoiceRequestForm({
  orderId,
  folio,
  uses,
  regimes,
  configured,
}: {
  orderId: string;
  folio: string;
  uses: { code: string; label: string }[];
  regimes: { code: string; label: string }[];
  configured: boolean;
}) {
  const router = useRouter();
  const [rfc, setRfc] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxSystem, setTaxSystem] = useState(regimes[0]?.code ?? '');
  const [cfdiUse, setCfdiUse] = useState(uses[0]?.code ?? '');
  const [postalCode, setPostalCode] = useState('');
  const [state, setState] = useState<InvoiceState>({ status: 'idle' });
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const result = await requestInvoiceAction(orderId, {
        rfc,
        legalName,
        taxSystem,
        cfdiUse,
        postalCode,
      });
      setState(result);
      if (result.status === 'ok') router.refresh();
    });
  }

  return (
    <div className="border border-[var(--line)] rounded-[var(--radius-m)] p-[var(--space-4)]">
      <p className="text-catalog mb-[var(--space-3)]">{folio}</p>

      {!configured ? (
        <p className="text-xs text-[var(--brass)] border-l-2 border-[var(--brass)] pl-[var(--space-3)] mb-[var(--space-3)] leading-relaxed">
          Timbrado no configurado: tu solicitud se registra y el taller la
          timbra al conectar su cuenta de Facturapi. Aquí no se generan PDF
          con sello falso.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-[var(--space-3)]">
        <div className="col-span-2 md:col-span-1">
          <label className={label} htmlFor={`rfc-${orderId}`}>RFC</label>
          <input
            id={`rfc-${orderId}`}
            className={field}
            placeholder="XAXX010101000"
            maxLength={13}
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={label} htmlFor={`cp-${orderId}`}>Código postal fiscal</label>
          <input
            id={`cp-${orderId}`}
            className={field}
            inputMode="numeric"
            maxLength={5}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className={label} htmlFor={`nombre-${orderId}`}>Nombre o razón social</label>
          <input
            id={`nombre-${orderId}`}
            className={field}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={label} htmlFor={`regimen-${orderId}`}>Régimen fiscal</label>
          <select
            id={`regimen-${orderId}`}
            className={field}
            value={taxSystem}
            onChange={(e) => setTaxSystem(e.target.value)}
          >
            {regimes.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className={label} htmlFor={`uso-${orderId}`}>Uso del CFDI</label>
          <select
            id={`uso-${orderId}`}
            className={field}
            value={cfdiUse}
            onChange={(e) => setCfdiUse(e.target.value)}
          >
            {uses.map((u) => (
              <option key={u.code} value={u.code}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p aria-live="polite" className="min-h-5 text-xs mt-[var(--space-3)]">
        {state.status === 'ok' ? (
          <span className="text-[var(--ok)]">{state.message}</span>
        ) : null}
        {state.status === 'error' ? (
          <span className="text-[var(--danger)]">{state.message}</span>
        ) : null}
      </p>

      <button type="button" className="btn-primary text-sm mt-[var(--space-2)]" onClick={submit} disabled={pending}>
        {pending ? 'Timbrando…' : configured ? 'Pedir factura CFDI 4.0' : 'Registrar solicitud'}
      </button>
    </div>
  );
}
