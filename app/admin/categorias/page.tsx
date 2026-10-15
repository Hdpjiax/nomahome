import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import CategoriesManager from './CategoriesManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Categorías · Taller', robots: { index: false } };

export default async function AdminCategoriesPage() {
  const admin = createAdminClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    admin.from('categories').select('id, slug, name, description, sort_order').order('sort_order'),
    admin
      .from('products')
      .select(`id, sku, name, product_categories(categories(id, slug))`)
      .order('name'),
  ]);

  const [{ data: links }] = await Promise.all([
    admin.from('product_categories').select('product_id, category_id'),
  ]);

  const catById = new Map((categories ?? []).map((c) => [c.id, c.slug]));
  const catList = (categories ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    count: (links ?? []).filter((l) => l.category_id === c.id).length,
  }));

  const productList = (products ?? []).map((p) => ({
    id: p.id,
    label: `${p.sku} · ${p.name}`,
    current: (p.product_categories ?? [])
      .map((pc) => catById.get(pc.categories?.id ?? '') ?? '')
      .filter(Boolean),
  }));

  return <CategoriesManager categories={catList} products={productList} />;
}
