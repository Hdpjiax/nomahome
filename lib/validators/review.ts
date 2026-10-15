import { z } from 'zod';

/**
 * Reseña de compra verificada (§8 reseñas). Solo pasa si el servidor
 * confirma un pedido pagado del usuario con esa variante; RLS también
 * lo exige en la base (defensa en dos capas).
 */
export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Elige de 1 a 5.')
    .max(5, 'Elige de 1 a 5.'),
  title: z.string().trim().max(120, 'Título corto: 120 caracteres.').optional().or(z.literal('')),
  body: z
    .string()
    .trim()
    .min(20, 'Cuéntanos cómo te va con la pieza: 20 caracteres o más.')
    .max(2000, 'Máximo 2000 caracteres.'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
