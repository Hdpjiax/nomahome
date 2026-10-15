import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Firma HMAC-SHA256 de los eventos de pago (§ checkout skill, regla 5):
 * sin firma válida no cambia nada. Comparación en tiempo constante.
 *
 * En sandbox, el secret es PAYMENTS_SANDBOX_SECRET. La simulación de
 * pagos aprobados existe SOLO en sandbox (PAYMENTS_MODE=sandbox).
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return false;
  const expected = signPayload(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ¿El modo de pagos permite simulación? Solo sandbox, jamás producción. */
export function isSandbox(): boolean {
  return process.env.PAYMENTS_MODE === 'sandbox';
}
