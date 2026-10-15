import type { MetadataRoute } from 'next';
import { getCategories, getPublishedPieces } from '@/lib/catalog/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  let products: { slug: string }[] = [];
  let categories: { slug: string }[] = [];
  try {
    [products, categories] = await Promise.all([
      getPublishedPieces(),
      getCategories(),
    ]);
  } catch {
    // Si la base no responde durante el build, el sitemap sale con las
    // rutas estáticas.
  }

  const staticRoutes = ['', '/buscar', '/resenas', '/contacto', '/envios', '/devoluciones', '/privacidad', '/terminos'];

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r ? `/${r.replace(/^\//, '')}` : ''}`,
      changeFrequency: 'weekly' as const,
      priority: r === '' ? 1 : 0.5,
    })),
    ...categories.map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
