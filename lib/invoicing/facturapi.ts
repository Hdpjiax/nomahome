import 'server-only';
import Facturapi, {
  CancellationMotive,
  InvoiceUse,
  TaxSystem,
} from 'facturapi';

/**
 * CFDI 4.0 con Facturapi (paquete oficial). La llave vive en
 * FACTURAPI_KEY, solo servidor. Sin llave: los formularios se muestran y
 * el estado es "timbrado no configurado" — jamás un PDF con sello falso.
 */

export const CFDI_USES: { code: string; label: string }[] = [
  { code: InvoiceUse.ADQUISICION_MERCANCIAS, label: 'G01 — Adquisición de mercancías' },
  { code: InvoiceUse.GASTOS_EN_GENERAL, label: 'G03 — Gastos en general' },
  { code: InvoiceUse.MOBILIARIO_Y_EQUIPO_DE_OFICINA, label: 'I02 — Mobiliario y equipo de oficina' },
  { code: InvoiceUse.EQUIPO_DE_COMPUTO, label: 'I04 — Equipo de cómputo' },
];

/**
 * Régimen fiscal del receptor. Catálogo c_RegimenFiscal del Anexo 20 del SAT,
 * expuesto por el paquete oficial facturapi (TaxSystem).
 */
export const TAX_REGIMES: { code: string; label: string }[] = [
  { code: TaxSystem.GENERAL_LEY_DE_PERSONAS_MORALES, label: '601 — General, Ley de Personas Morales' },
  { code: TaxSystem.PERSONAS_MORALES_CON_FINES_NO_LUCRATIVOS, label: '603 — Personas morales con fines no lucrativos' },
  { code: TaxSystem.SUELDOS_Y_SALARIOS, label: '605 — Sueldos y salarios' },
  { code: TaxSystem.ARRENDAMIENTO, label: '606 — Arrendamiento' },
  { code: TaxSystem.DEMAS_INGRESOS, label: '608 — Demás ingresos' },
  {
    code: TaxSystem.PERSONAS_FISICAS_CON_ACTIVIDADES_EMPRESARIALES_Y_PROFESIONALES,
    label: '612 — Personas físicas con actividades empresariales y profesionales',
  },
  { code: TaxSystem.SIN_OBLIGACIONES_FISCALES, label: '616 — Sin obligaciones fiscales' },
  { code: TaxSystem.REGIMEN_DE_INCORPORACION_FISCAL, label: '621 — Régimen de Incorporación Fiscal' },
  { code: TaxSystem.RÉGIMEN_SIMPLIFICADO_DE_CONFIANZA, label: '626 — Régimen Simplificado de Confianza' },
];

export function isFacturapiConfigured(): boolean {
  return Boolean(process.env.FACTURAPI_KEY);
}

export function getFacturapi(): Facturapi | null {
  if (!isFacturapiConfigured()) return null;
  return new Facturapi(process.env.FACTURAPI_KEY as string);
}

export type StampResult =
  | { ok: true; invoiceId: string; uuid: string; total: number }
  | { ok: false; error: string };

/**
 * Timbra el CFDI 4.0 de un pedido pagado. Los montos van NETOS de IVA
 * (el precio de vitrina lo incluye y se desglosa con lib/money);
 * Facturapi agrega el 16% de IVA. Forma de pago 03: transferencia
 * electrónica (SPEI), método PUE.
 */
export async function stampInvoice(input: {
  fiscal: {
    rfc: string;
    legalName: string;
    taxSystem: string;
    cfdiUse: string;
    zip: string;
    email: string;
  };
  order: {
    folio: string;
    totalCents: number;
    shippingCents: number;
    lines: { name: string; quantity: number; unitNetCents: number }[];
  };
}): Promise<StampResult> {
  const client = getFacturapi();
  if (!client) return { ok: false, error: 'Timbrado no configurado.' };

  const shippingNet = Math.round(input.order.shippingCents / 1.16);

  try {
    const invoice = await client.invoices.create({
      customer: {
        legal_name: input.fiscal.legalName,
        tax_id: input.fiscal.rfc,
        tax_system: input.fiscal.taxSystem,
        address: { zip: input.fiscal.zip, country: 'MEX' },
        email: input.fiscal.email,
      },
      items: [
        ...input.order.lines.map((l) => ({
          quantity: l.quantity,
          product: {
            description: `${l.name} (pedido ${input.order.folio})`,
            price: l.unitNetCents / 100,
          },
        })),
        ...(input.order.shippingCents > 0
          ? [
              {
                quantity: 1,
                product: {
                  description: `Envío del pedido ${input.order.folio}`,
                  price: shippingNet / 100,
                },
              },
            ]
          : []),
      ],
      use: input.fiscal.cfdiUse,
      payment_form: '03', // Transferencia electrónica de fondos (SPEI)
      payment_method: 'PUE',
      currency: 'MXN',
      type: 'I',
      folio_number: input.order.folio,
    });

    const typed = invoice as unknown as {
      id: string;
      uuid?: string;
      total: number;
    };
    if (!typed.uuid) {
      // Facturapi devuelve el folio fiscal al timbrar; sin uuid no hay CFDI.
      return { ok: false, error: 'La factura no se timbró. Inténtalo en un rato.' };
    }

    return {
      ok: true,
      invoiceId: typed.id,
      uuid: typed.uuid,
      total: typed.total,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return { ok: false, error: `Facturapi rechazó el timbrado: ${msg}`.slice(0, 300) };
  }
}

export async function cancelInvoice(providerInvoiceId: string) {
  const client = getFacturapi();
  if (!client) return { ok: false, error: 'Timbrado no configurado.' };
  try {
    // 02: errores con relación (SAT). Motivos vigentes del paquete oficial.
    await client.invoices.cancel(providerInvoiceId, {
      motive: CancellationMotive.ERRORES_CON_RELACION,
    });
    return { ok: true, error: '' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return { ok: false, error: msg };
  }
}

export async function resendInvoiceByEmail(providerInvoiceId: string, email: string) {
  const client = getFacturapi();
  if (!client) return { ok: false, error: 'Timbrado no configurado.' };
  try {
    await client.invoices.sendByEmail(providerInvoiceId, { email });
    return { ok: true, error: '' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return { ok: false, error: msg };
  }
}

export async function fetchInvoice(providerInvoiceId: string) {
  const client = getFacturapi();
  if (!client) return null;
  try {
    const invoice = await client.invoices.retrieve(providerInvoiceId);
    return invoice as unknown as { id: string; uuid: string; status: string; total: number };
  } catch {
    return null;
  }
}

export async function invoicePdfUrl(providerInvoiceId: string) {
  const client = getFacturapi();
  if (!client) return null;
  try {
    const url = await client.invoices.downloadPdfUrl(providerInvoiceId);
    return (url as unknown as { url: string }).url;
  } catch {
    return null;
  }
}
