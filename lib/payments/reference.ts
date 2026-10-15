import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';

/** Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para referencias visibles. */
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Referencia pública del pedido: CL-K7F3QD. El cliente la pone como
 * concepto de su transferencia SPEI y el taller la reconcilia en el banco.
 */
export function newPublicRef(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `CL-${out}`;
}

/** Token secreto del pedido para el comprador invitado. */
export function newGuestToken(): string {
  return randomBytes(24).toString('hex');
}

/** Id de pago del proveedor para eventos simulados en sandbox. */
export function newSimulatedPaymentId(): string {
  return `sim_${randomBytes(12).toString('hex')}`;
}
