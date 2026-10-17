import { describe, it, expect } from 'vitest';
import { signPayload, verifySignature } from '@/lib/payments/signature';

describe('payments — firma de eventos', () => {
  const secret = 'secreto_de_pruebas_32_caracteres_minimo!!';
  const body = JSON.stringify({
    public_ref: 'CL-K7F3QD',
    provider_payment_id: 'sim_abc123',
    status: 'approved',
    amount_cents: 413900,
  });

  it('verifica una firma correcta', () => {
    const sig = signPayload(body, secret);
    expect(verifySignature(body, sig, secret)).toBe(true);
  });

  it('rechaza un cuerpo alterado', () => {
    const sig = signPayload(body, secret);
    const tampered = body.replace('413900', '999999');
    expect(verifySignature(tampered, sig, secret)).toBe(false);
  });

  it('rechaza un secreto distinto', () => {
    const sig = signPayload(body, secret);
    expect(verifySignature(body, sig, 'otro_secreto_completamente_distinto')).toBe(false);
  });

  it('rechaza firma malformada o vacía', () => {
    expect(verifySignature(body, '', secret)).toBe(false);
    expect(verifySignature(body, 'no-es-hex', secret)).toBe(false);
  });

  it('sin secreto configurado no verifica nada', () => {
    expect(verifySignature(body, signPayload(body, secret), '')).toBe(false);
  });
});
