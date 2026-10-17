import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ProductEditor, { type EditorProduct } from '@/components/admin/ProductEditor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Editor · Taller', robots: { index: false } };

type PageProps = { params: Promise<{ id: string }> };

/**
 * Editor de pieza. id === 'nuevo' crea una pieza desde cero.
 */
export default async function ProductEditorPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: categories }, { data: colors }] = await Promise.all([
    admin.from('categories').select('slug, name').order('sort_order'),
    admin.from('colors').select('id, name, hex').order('name'),
  ]);

  const catList = (categories ?? []).map((c) => ({ slug: c.slug, name: c.name }));
  const colorList = (colors ?? []).map((c) => ({ id: c.id, name: c.name, hex: c.hex }));

  if (id === 'nuevo') {
    const empty: EditorProduct = {
      id: null,
      slug: '',
      sku: '',
      name: '',
      summary: '',
      description: '',
      videoUrl: '',
      seoTitle: '',
      seoDescription: '',
      published: false,
      categorySlugs: [],
      variants: [],
      tabs: [],
    };
    return <ProductEditor product={empty} categories={catList} colors={colorList} />;
  }

  const { data: product, error } = await admin
    .from('products')
    .select(
      `id, slug, sku, name, summary, description, video_url, seo_title, seo_description, published,
       product_categories(categories(slug)),
       product_variants(
         id, sku, color_id, material, width_cm, depth_cm, height_cm, weight_kg,
         price_cents, compare_at_cents, stock, published,
         product_media(id, path, alt, sort_order)
       ),
       product_tabs(id, title, body, sort_order)`
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !product) notFound();

  type Row = typeof product & {
    product_categories: { categories: { slug: string } }[] | null;
    product_variants:
      | (EditorProduct['variants'][number] & {
          color_id: string;
          product_media: { id: string; path: string; alt: string; sort_order: number }[] | null;
        })[]
      | null;
    product_tabs: { id: string; title: string; body: string; sort_order: number }[] | null;
  };
  const row = product as Row;

  const editorProduct: EditorProduct = {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    summary: row.summary ?? '',
    description: row.description ?? '',
    videoUrl: row.video_url ?? '',
    seoTitle: row.seo_title ?? '',
    seoDescription: row.seo_description ?? '',
    published: row.published,
    categorySlugs: (row.product_categories ?? [])
      .map((pc) => pc.categories?.slug)
      .filter((s): s is string => Boolean(s)),
    variants: (row.product_variants ?? [])
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        colorId: v.color_id,
        material: v.material,
        widthCm: v.width_cm,
        depthCm: v.depth_cm,
        heightCm: v.height_cm,
        weightKg: v.weight_kg,
        priceCents: v.price_cents,
        compareAtCents: v.compare_at_cents,
        stock: v.stock,
        published: v.published,
        media: (v.product_media ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => ({ id: m.id, path: m.path, alt: m.alt })),
      }))
      .sort((a, b) => a.sku.localeCompare(b.sku)),
    tabs: (row.product_tabs ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({ id: t.id, title: t.title, body: t.body })),
  };

  return <ProductEditor product={editorProduct} categories={catList} colors={colorList} />;
}
