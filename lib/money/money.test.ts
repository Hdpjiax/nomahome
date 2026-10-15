import { describe, it, expect } from 'vitest';
import {
  taxIncludedCents,
  splitIva,
  shippingCents,
  lineTotal,
  orderTotal,
  formatMXN,
  assertCents,
} from './index';

describe('money — aritmética entera en centavos', () => {
  describe('splitIva — IVA contenido en el precio de vitrina', () => {
    it('divide exacto $1,160.00 en $1,000.00 + $160.00', () => {
      const r = splitIva(116_000);
      expect(r.taxCents).toBe(16_000);
      expect(r.subtotalCents).toBe(100_000);
      expect(r.totalCents).toBe(116_000);
    });

    it('redondea half away from zero al centavo', () => {
      // 100 * 16/116 = 13.79... → 14
      expect(splitIva(100).taxCents).toBe(14);
      expect(splitIva(100).subtotalCents).toBe(86);
    });

    it('subtotal + tax siempre reconstruye el total', () => {
      for (const cents of [1, 3, 99, 24_900, 389_000, 2_290_000]) {
        const r = splitIva(cents);
        expect(r.subtotalCents + r.taxCents).toBe(cents);
      }
    });

    it('rechaza montos no enteros o negativos', () => {
      expect(() => splitIva(10.5)).toThrow();
      expect(() => splitIva(-1)).toThrow();
    });
  });

  describe('taxIncludedCents — de subtotal ex-IVA a total', () => {
    it('agrega 16% exacto a $1,000.00', () => {
      expect(taxIncludedCents(100_000)).toBe(116_000);
    });

    it('es la inversa de splitIva en el redondeo del taller', () => {
      expect(splitIva(taxIncludedCents(100_000)).subtotalCents).toBe(100_000);
    });
  });

  describe('shippingCents', () => {
    it('gratis desde $15,000.00 de subtotal', () => {
      expect(shippingCents(1_500_000)).toBe(0);
      expect(shippingCents(2_290_000, 'Jalisco')).toBe(0);
    });

    it('$249.00 dentro de Michoacán, con o sin acento', () => {
      expect(shippingCents(100_000, 'Michoacán')).toBe(24_900);
      expect(shippingCents(100_000, 'michoacan')).toBe(24_900);
      expect(shippingCents(100_000, 'MICHOACÁN ')).toBe(24_900);
    });

    it('$399.00 al resto de México y sin estado', () => {
      expect(shippingCents(100_000, 'CDMX')).toBe(39_900);
      expect(shippingCents(100_000)).toBe(39_900);
    });
  });

  describe('lineTotal', () => {
    it('multiplica precio unitario × cantidad', () => {
      expect(lineTotal(10_000, 2)).toBe(20_000);
      expect(lineTotal(389_000, 4)).toBe(1_556_000);
      expect(lineTotal(10_000, 0)).toBe(0);
    });

    it('rechaza qty o precio inválidos', () => {
      expect(() => lineTotal(10_000, -1)).toThrow();
      expect(() => lineTotal(10_000, 1.5)).toThrow();
      expect(() => lineTotal(-100, 1)).toThrow();
    });
  });

  describe('orderTotal — IVA informado como incluido', () => {
    it('cotiza envío por estado y desglosa el IVA del total', () => {
      const r = orderTotal(100_000, undefined, 'Michoacán');
      expect(r.shippingCents).toBe(24_900);
      expect(r.totalCents).toBe(124_900);
      // 124900 * 16 / 116 = 17227.58 → 17228 (half away from zero)
      expect(r.taxCents).toBe(17_228);
      expect(r.subtotalCents + r.taxCents).toBeLessThanOrEqual(r.totalCents);
    });

    it('acepta envío explícito (ya decidido por el servidor)', () => {
      const r = orderTotal(389_000, 24_900);
      expect(r.totalCents).toBe(413_900);
      expect(r.taxCents).toBe(57_090);
    });

    it('envío gratis sobre el umbral', () => {
      const r = orderTotal(1_600_000, undefined, 'Nuevo León');
      expect(r.shippingCents).toBe(0);
      expect(r.totalCents).toBe(1_600_000);
      expect(r.taxCents).toBe(220_690);
    });
  });

  describe('assertCents y formatMXN', () => {
    it('assertCents valida enteros no negativos', () => {
      expect(assertCents(0)).toBe(0);
      expect(() => assertCents(0.5)).toThrow();
      expect(() => assertCents(-5)).toThrow();
    });

    it('formatMXN pinta pesos mexicanos', () => {
      expect(formatMXN(2_290_000)).toContain('22,900');
      expect(formatMXN(0)).toContain('0.00');
    });
  });
});
