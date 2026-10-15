import { z } from 'zod';

/** Correo del comprador invitado (§8 checkout). */
export const checkoutEmailSchema = z.email('Necesitamos un correo para enviarte el recibo.');

/** Esquema del evento de pago del webhook (solo sandbox). */
export const webhookEventSchema = z.object({
  public_ref: z.string().regex(/^CL-[2-9A-HJKMNP-Z]{6}$/, 'Referencia inválida.'),
  provider_payment_id: z.string().min(4, 'Falta el id del pago.'),
  status: z.literal('approved', 'Solo se aplican pagos aprobados.'),
  amount_cents: z
    .number()
    .int('El monto va en centavos enteros.')
    .positive('El monto debe ser positivo.'),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
