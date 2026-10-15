import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CatalogFilters,
  CatalogPiece,
  CatalogVariant,
  CategoryFilter,
  SortOrder,
} from './types';

/**
 * Consultas de catálogo. Se ejecutan en el servidor con la sesión del
 * visitante: RLS ya deja pasar solo productos, variantes y media publicados.
 */

// Fila cruda que devuelve la consulta embebida.
type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  summary: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  video_url: string | null;
  product_categories: { categories: { slug: string; name: string } }[] | null;
  product_variants:
    | {
        id: string;
        sku: string;
        material: string;
        price_cents: number;
        compare_at_cents: number | null;
        stock: number;
        width_cm: number | null;
        depth_cm: number | null;
        height_cm: number | null;
        weight_kg: number | null;
        published: boolean;
        colors: { name: string; hex: string } | null;
        product_media:
          | {
              path: string;
              alt: string;
              width: number | null;
              height: number | null;
              sort_order: number;
            }[]
          | null;
      }[]
    | null;
};

const PRODUCT_SELECT = `
  id, slug, sku, name, summary, description, seo_title, seo_description, video_url,
  product_categories(categories(slug, name)),
  product_variants(
    id, sku, material, price_cents, compare_at_cents, stock,
    width_cm, depth_cm, height_cm, weight_kg, published,
    colors(name, hex),
    product_media(path, alt, width, height, sort_order)
  )
`;

function mapPiece(row: ProductRow): CatalogPiece {
  const variants: CatalogVariant[] = (row.product_variants ?? [])
    .filter((v) => v.published && v.colors)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      material: v.material,
      priceCents: v.price_cents,
      compareAtCents: v.compare_at_cents,
      stock: v.stock,
      color: v.colors as { name: string; hex: string },
      dimensions: {
        widthCm: v.width_cm,
        depthCm: v.depth_cm,
        heightCm: v.height_cm,
        weightKg: v.weight_kg,
      },
      media: (v.product_media ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          path: m.path,
          alt: m.alt,
          width: m.width,
          height: m.height,
        })),
    }));

  const prices = variants.map((v) => v.priceCents);
  const priceCents = prices.length > 0 ? Math.min(...prices) : 0;
  const withCompare = variants.find((v) => v.compareAtCents !== null);
  const colorMap = new Map<string, { name: string; hex: string }>();
  for (const v of variants) colorMap.set(v.color.name, v.color);
  const materials = [...new Set(variants.map((v) => v.material).filter(Boolean))];

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    summary: row.summary,
    description: row.description,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    videoUrl: row.video_url,
    categories: (row.product_categories ?? [])
      .map((pc) => pc.categories)
      .filter((c): c is { slug: string; name: string } => c !== null),
    variants,
    priceCents,
    compareAtCents: withCompare?.compareAtCents ?? null,
    colors: [...colorMap.values()],
    materials,
    inStock: variants.some((v) => v.stock > 0),
  };
}

function applyFilters(pieces: CatalogPiece[], f: CatalogFilters): CatalogPiece[] {
  let out = pieces;
  if (f.color) {
    const c = f.color.toLowerCase();
    out = out.filter((p) => p.colors.some((col) => col.name.toLowerCase() === c));
  }
  if (f.material) {
    const m = f.material.toLowerCase();
    out = out.filter((p) => p.materials.some((mat) => mat.toLowerCase().includes(m)));
  }
  if (typeof f.priceMinCents === 'number') {
    out = out.filter((p) => p.priceCents >= (f.priceMinCents as number));
  }
  if (typeof f.priceMaxCents === 'number') {
    out = out.filter((p) => p.priceCents <= (f.priceMaxCents as number));
  }
  const orden: SortOrder = f.orden ?? 'reciente';
  if (orden === 'precio-asc') out = [...out].sort((a, b) => a.priceCents - b.priceCents);
  else if (orden === 'precio-desc') out = [...out].sort((a, b) => b.priceCents - a.priceCents);
  else if (orden === 'nombre') out = [...out].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return out;
}

export async function getHomepageBlocks() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('homepage_blocks')
    .select('id, kind, title, body, product_id, sort_order, published')
    .eq('published', true)
    .order('sort_order');
  if (error) throw new Error(`homepage_blocks: ${error.message}`);
  return data;
}

/** Todas las piezas publicadas (para home y para filtrar en TS). */
export async function getPublishedPieces(): Promise<CatalogPiece[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`products: ${error.message}`);
  return (data as ProductRow[]).map(mapPiece).filter((p) => p.variants.length > 0);
}

/** Piezas con al menos una variante en la categoría dada. */
export async function getPiecesByCategory(
  categorySlug: string,
  filters: CatalogFilters = {}
): Promise<CatalogPiece[]> {
  const all = await getPublishedPieces();
  const inCat = all.filter((p) => p.categories.some((c) => c.slug === categorySlug));
  return applyFilters(inCat, filters);
}

/** Búsqueda full-text en español (nombre, summary, descripción) + material. */
export async function searchPieces(query: string): Promise<CatalogPiece[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('published', true)
    .textSearch('search', q, { config: 'spanish', type: 'plain' });
  if (error) throw new Error(`search: ${error.message}`);
  const byText = (data as ProductRow[]).map(mapPiece).filter((p) => p.variants.length > 0);
  // El material vive en la variante: se complementa con filtro en TS para
  // que "roble" también encuentre por material, no solo por descripción.
  const ql = q.toLowerCase();
  const all = await getPublishedPieces();
  const byMaterial = all.filter(
    (p) => p.materials.some((m) => m.toLowerCase().includes(ql)) && !byText.some((b) => b.id === p.id)
  );
  return [...byText, ...byMaterial];
}

export async function getCategories(): Promise<CategoryFilter[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categories')
    .select('slug, name, description, sort_order')
    .order('sort_order');
  if (error) throw new Error(`categories: ${error.message}`);
  const pieces = await getPublishedPieces();
  return data.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    productCount: pieces.filter((p) => p.categories.some((pc) => pc.slug === c.slug)).length,
  }));
}

export async function getPieceBySlug(slug: string): Promise<CatalogPiece | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('published', true)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`products(${slug}): ${error.message}`);
  if (!data) return null;
  const piece = mapPiece(data as ProductRow);
  return piece.variants.length > 0 ? piece : null;
}

export type ProductTab = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

/** Pestañas de la ficha, en el orden que fijó el admin (§8). */
export async function getProductTabs(productId: string): Promise<ProductTab[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('product_tabs')
    .select('id, title, body, sort_order')
    .eq('product_id', productId)
    .order('sort_order');
  if (error) throw new Error(`product_tabs: ${error.message}`);
  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    body: t.body,
    sortOrder: t.sort_order,
  }));
}

export type ProductReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  variantSku: string;
};

/** Reseñas publicadas de las variantes de una pieza. */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `id, rating, title, body, author_name, created_at,
       product_variants!inner(sku, product_id)`
    )
    .eq('status', 'published')
    .eq('product_variants.product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(`reviews: ${error.message}`);
  return (data ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      rating: number;
      title: string;
      body: string;
      author_name: string;
      created_at: string;
      product_variants: { sku: string };
    };
    return {
      id: row.id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      authorName: row.author_name,
      createdAt: row.created_at,
      variantSku: row.product_variants.sku,
    };
  });
}

/** Relacionados: piezas de la misma categoría, sin incluir la propia. */
export async function getRelatedPieces(
  piece: CatalogPiece,
  limit = 4
): Promise<CatalogPiece[]> {
  const categorySlug = piece.categories[0]?.slug;
  if (!categorySlug) return [];
  const all = await getPiecesByCategory(categorySlug);
  return all.filter((p) => p.id !== piece.id).slice(0, limit);
}
