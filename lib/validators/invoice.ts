import { z } from 'zod';
import { CFDI_USES, TAX_REGIMES } from '@/lib/invoicing/facturapi';

/**
 * Datos fiscales del receptor (§6 facturacion-cfdi). Catálogos vigentes
 * expuestos por el paquete oficial `facturapi` (Anexo 20 del SAT);
 * no inventamos el catálogo del SAT.
 */
const useCodes = CFDI_USES.map((u) => u.code) as [string, ...string[]];
const regimeCodes = TAX_REGIMES.map((r) => r.code) as [string, ...string[]];

export const fiscalDataSchema = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9Ñ]{3}$/, 'RFC con homoclave: 12 o 13 caracteres.'),
  legalName: z
    .string()
    .trim()
    .min(3, 'Nombre o razón social como está en tu constancia.')
    .max(200),
  taxSystem: z.enum(regimeCodes, 'Elige tu régimen fiscal.'),
  cfdiUse: z.enum(useCodes, 'Elige el uso del CFDI.'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'El código postal fiscal lleva 5 dígitos.'),
});

export type FiscalData = z.infer<typeof fiscalDataSchema>;
