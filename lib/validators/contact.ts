import { z } from 'zod';

/**
 * Validación del formulario de contacto (§8). Zod en el servidor; el
 * cliente muestra los errores que devuelve la acción.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Escribe tu nombre como te lo decimos en el taller.')
    .max(120),
  email: z.email('Necesitamos un correo para contestarte.'),
  phone: z.string().trim().max(24).optional().or(z.literal('')),
  body: z
    .string()
    .trim()
    .min(10, 'Cuéntanos un poco más para poder ayudarte.')
    .max(2000),
});

export type ContactState =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };
