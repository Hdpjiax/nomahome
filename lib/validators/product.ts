import { z } from 'zod';

/**
 * Validación de pieza para el panel (Zod corre en el servidor; el cliente
 * muestra lo que responde la acción). Vive aquí porque los archivos
 * 'use server' solo pueden exportar funciones.
 */
export const productSchema = z.object({
  name: z.string().trim().min(2, 'Nombre de la pieza.').max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug: minúsculas, números y guiones.')
    .min(3)
    .max(140),
  sku: z.string().trim().regex(/^[A-Z0-9-]+$/, 'SKU en mayúsculas.').min(3).max(40),
  summary: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  videoUrl: z.string().trim().url().optional().or(z.literal('')),
  seoTitle: z.string().trim().max(160).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(300).optional().or(z.literal('')),
  published: z.boolean(),
  categorySlugs: z.array(z.string()).max(8),
});

export type ProductInput = z.infer<typeof productSchema>;
