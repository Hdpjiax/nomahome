import { describe, it, expect } from 'vitest';
import {
  taxIncludedCents,
  splitIva,
  shippingCents,
  lineTotal,
  orderTotal
} from './index';

describe('money', () => {
  describe('taxIncludedCents', () => {
    it('adds 16% IVA to subtotal', () => {
      expect(taxIncludedCents(100000)).toBe(116000);
    });
  });

  describe('splitIva', () => {
    it('splits a total with IVA', () => {
      const result = splitIva(116000);
      expect(result.subtotalCents).toBe(100000);
      expect(result.taxCents).toBe(16000);
      expect(result.totalCents).toBe(116000);
    });
  });

  describe('shippingCents', () => {
    it('returns 0 for subtotal >= 1500000', () => {
      expect(shippingCents(1500000)).toBe(0);
      expect(shippingCents(2000000)).toBe(0);
    });

    it('returns 24900 for Michoacán under threshold', () => {
      expect(shippingCents(100000, 'michoacán')).toBe(24900);
      expect(shippingCents(100000, 'Michoacan')).toBe(24900);
    });

    it('returns 39900 for other states under threshold', () => {
      expect(shippingCents(100000, 'CDMX')).toBe(39900);
      expect(shippingCents(100000)).toBe(39900);
    });
  });

  describe('lineTotal', () => {
    it('multiplies unit price by quantity', () => {
      expect(lineTotal(10000, 2)).toBe(20000);
      expect(lineTotal(10000, 0)).toBe(0);
    });
  });

  describe('orderTotal', () => {
    it('calculates correct totals with auto-shipping', () => {
      const result = orderTotal(100000, -1, 'michoacán');
      expect(result.subtotalCents).toBe(100000);
      expect(result.shippingCents).toBe(24900);
      expect(result.taxCents).toBeGreaterThan(19980);
      expect(result.totalCents).toBeGreaterThan(144880);
    });
  });
});
