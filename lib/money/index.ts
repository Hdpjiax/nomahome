/**
 * Money utilities for Casa Lumen / NOMAHOME.
 *
 * Reglas de la casa (INSTRUCCION.md §9):
 *   * Todos los montos son centavos enteros (MXN). Jamás flotantes para cobrar.
 *   * Redondeo half away from zero al centavo.
 *   * El precio de vitrina incluye IVA 16%: el IVA se informa desglosado
 *     a partir del total (16/116), nunca se suma encima del precio.
 *   * `shippingCents`: 0 si el subtotal >= $15,000 MXN; si no, $249 dentro
 *     de Michoacán y $399 al resto de México. Cotizar paquetería real es
 *     fase posterior (documentado en DEPLOY.md).
 */

/** IVA vigente en México: 16%. */
const IVA_NUM = 16;
const IVA_DEN = 100;
/** Precio con IVA: cada peso de IVA viene de 116 centavos de total. */
const GROSS_TAX_NUM = IVA_NUM;
const GROSS_TAX_DEN = IVA_NUM + IVA_DEN; // 116

/** División entera con redondeo half away from zero. Solo enteros. */
function divRoundHalfAway(num: number, den: number): number {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den)) {
    throw new Error('divRoundHalfAway: operandos enteros');
  }
  if (den === 0) throw new Error('divRoundHalfAway: denominador cero');
  const sign = num < 0 !== den < 0 ? -1 : 1;
  const n = Math.abs(num);
  const d = Math.abs(den);
  const q = Math.floor((n + Math.floor(d / 2)) / d);
  // Half exacto se va lejos del cero: floor((n + d/2)/d) ya lo hace para
  // restos exactos de .5 y enteros positivos.
  return sign * q;
}

/** Valida que un monto sea centavos enteros no negativos. */
export function assertCents(value: number, label = 'monto'): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} debe ser entero no negativo en centavos`);
  }
  return value;
}

/**
 * IVA contenido en un precio que ya lo incluye (16/116 del total).
 * Devuelve { subtotalCents, taxCents, totalCents }.
 */
export function splitIva(totalCents: number): {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
} {
  assertCents(totalCents, 'totalCents');
  const taxCents = divRoundHalfAway(totalCents * GROSS_TAX_NUM, GROSS_TAX_DEN);
  return {
    subtotalCents: totalCents - taxCents,
    taxCents,
    totalCents,
  };
}

/**
 * Total con IVA a partir de un subtotal SIN IVA (poco uso: el catálogo
 * siempre publica precios con IVA incluido).
 */
export function taxIncludedCents(subtotalCents: number): number {
  assertCents(subtotalCents, 'subtotalCents');
  const taxCents = divRoundHalfAway(subtotalCents * IVA_NUM, IVA_DEN);
  return subtotalCents + taxCents;
}

/**
 * Envío por estado. Gratis desde $15,000 MXN de subtotal.
 * Michoacán: $249. Resto de México: $399.
 */
export function shippingCents(subtotalCents: number, state?: string): number {
  assertCents(subtotalCents, 'subtotalCents');
  const FREE_THRESHOLD = 1_500_000;
  if (subtotalCents >= FREE_THRESHOLD) return 0;
  const normalized = state
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return normalized === 'michoacan' ? 24_900 : 39_900;
}

/** Total de línea: precio unitario × cantidad, en centavos enteros. */
export function lineTotal(unitPriceCents: number, qty: number): number {
  assertCents(unitPriceCents, 'unitPriceCents');
  if (!Number.isSafeInteger(qty) || qty < 0) {
    throw new Error('qty debe ser entero no negativo');
  }
  return unitPriceCents * qty;
}

/**
 * Totales del pedido a partir de un subtotal con IVA incluido.
 * `shippingCentsValue` negativo o ausente => se cotiza con shippingCents().
 * El IVA se desglosa del total (16/116): se informa como incluido.
 */
export function orderTotal(
  subtotalCents: number,
  shippingCentsValue?: number,
  state?: string
): {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
} {
  assertCents(subtotalCents, 'subtotalCents');
  const shipping =
    shippingCentsValue === undefined || shippingCentsValue < 0
      ? shippingCents(subtotalCents, state)
      : assertCents(shippingCentsValue, 'shippingCents');

  const total = subtotalCents + shipping;
  const { taxCents } = splitIva(total);
  return {
    subtotalCents,
    shippingCents: shipping,
    taxCents,
    totalCents: total,
  };
}

/** Formato monetario para pantalla (MXN, es-MX). */
export function formatMXN(cents: number): string {
  assertCents(cents, 'cents');
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
