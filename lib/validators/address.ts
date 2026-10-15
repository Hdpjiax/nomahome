import { z } from 'zod';

/**
 * Dirección mexicana (§8 checkout). Zod en servidor; el cliente muestra
 * los errores que devuelve la acción.
 */
export const addressSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(2, '¿A nombre de quién se entrega?')
    .max(120),
  line1: z.string().trim().min(5, 'Calle y número, para que el paquete llegue.').max(160),
  line2: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Falta la ciudad o pueblo.').max(120),
  state: z.string().trim().min(2, 'Falta el estado.').max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'El código postal mexicano lleva 5 dígitos.'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+52\s?)?1?\d{10}$/, 'Un teléfono de 10 dígitos, por favor.'),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+52\s?)?1?\d{10}$/, 'Un teléfono de 10 dígitos, por favor.')
    .optional()
    .or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;
