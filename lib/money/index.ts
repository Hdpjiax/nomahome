/**
 * Money utilities for Casa Lumen.
 * All amounts in centavos (integers). IVA = 16% (Mexico).
 * Redondeo: half-away-from-zero.
 */

const IVA_RATE = 0.16;

/**
 * Calculate total cents including IVA from subtotal.
 * If subtotal includes IVA, use splitIva instead.
 */
export function taxIncludedCents(subtotalCents: number): number {
  const taxCents = roundCents(subtotalCents * IVA_RATE);
  return subtotalCents + taxCents;
}

/**
 * Split a total price (including IVA) into subtotal and tax.
 * Returns { subtotalCents, taxCents, totalCents }
 */
export function splitIva(totalCents: number): {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
} {
  const subtotalCents = roundCents(totalCents / (1 + IVA_RATE));
  const taxCents = totalCents - subtotalCents;
  return { subtotalCents, taxCents, totalCents };
}

/**
 * Shipping cost by state within Mexico.
 * Free if subtotal >= 15,000 MXN (1,500,000 centavos).
 * Otherwise: 249 MXN (Michoacán) or 399 MXN (rest of Mexico).
 */
export function shippingCents(subtotalCents: number, state?: string): number {
  const FREE_THRESHOLD = 1_500_000;
  if (subtotalCents >= FREE_THRESHOLD) return 0;
  const isMichoacan = state?.toLowerCase() === 'michoacán' || state?.toLowerCase() === 'michoacan';
  return isMichoacan ? 24_900 : 39_900;
}

/**
 * Calculate line total for qty × unit price.
 */
export function lineTotal(unitPriceCents: number, qty: number): number {
  if (qty < 0) throw new Error('qty must be >= 0');
  if (unitPriceCents < 0) throw new Error('unitPriceCents must be >= 0');
  return unitPriceCents * qty;
}

/**
 * Calculate complete order total.
 */
export function orderTotal(
  subtotalCents: number,
  shippingCentsOrZero: number,
  stateForShipping?: string
): {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
} {
  const computedShipping = shippingCentsOrZero >= 0
    ? shippingCentsOrZero
    : shippingCents(subtotalCents, stateForShipping);

  const taxableCents = subtotalCents + computedShipping;
  const taxCents = roundCents(taxableCents * IVA_RATE);
  const totalCents = taxableCents + taxCents;

  return {
    subtotalCents,
    shippingCents: computedShipping,
    taxCents,
    totalCents,
  };
}

/**
 * Format cents as MXN string for display.
 */
export function formatMXN(cents: number): string {
  const pesos = cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pesos);
}

/**
 * Round half-away-from-zero.
 * Used for all financial calculations.
 */
function roundCents(value: number): number {
  if (value >= 0) {
    return Math.floor(value + 0.5);
  } else {
    return Math.ceil(value - 0.5);
  }
}
