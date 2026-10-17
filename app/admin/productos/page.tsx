import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatMXN } from '@/lib/money';
import PublishToggle from '@/components/admin/PublishToggle';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Productos · Taller', robots: { index: false } };

/** Tabla densa de productos (§8 admin). Mono para datos, sin panel gris. */
export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const [{ data: products }, { data: allCats }] = await Promise.all([
    admin
      .from('products')
      .select(
        `id, slug, sku, name, published,
         product_variants(sku, price_cents, stock, published),
         product_categories(categories(slug, name))`
      )
      .order('created_at', { ascending: false }),
    admin.from('categories').select('slug, name'),
  ]);

  const rows = (products ?? []).map((p) => {
    const variants = (p.product_variants ?? []).filter((v) => v.published);
    const prices = variants.map((v) => v.price_cents);
    const stock = (p.product_variants ?? []).reduce((n, v) => n + v.stock, 0);
    const cats = (p.product_categories ?? [])
      .map((pc) => pc.categories?.name)
      .filter(Boolean)
      .join(', ');
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      published: p.published,
      minPrice: prices.length ? Math.min(...prices) : null,
      variants: (p.product_variants ?? []).length,
      stock,
      cats,
    };
  });

  return (
    <div className="container-lumen py-[var(--space-7)]">
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-4)] mb-[var(--space-5)]">
        <div>
          <p className="text-catalog mb-[var(--space-2)]">Taller · catálogo</p>
          <h1 className="font-display font-semibold text-4xl tracking-[-0.02em]">Productos</h1>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary text-sm">
          Crear pieza
        </Link>
      </div>

      <div className="border border-[var(--line)] rounded-[var(--radius-m)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)] text-left">
              <th className="px-[var(--space-3)] py-[var(--space-2)]">SKU</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Pieza</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Categorías</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Precio mín.</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Variantes</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-right">Stock</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]">Vitrina</th>
              <th className="px-[var(--space-3)] py-[var(--space-2)]"></th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper-2)]/60"
              >
                <td className="px-[var(--space-3)] py-[var(--space-2)] whitespace-nowrap">
                  {r.sku}
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)]">
                  <Link
                    href={`/admin/productos/${r.id}`}
                    className="underline underline-offset-4 decoration-[var(--brass)]"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] font-ui text-xs text-[var(--ink-soft)]">
                  {r.cats || '—'}
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">
                  {r.minPrice !== null ? formatMXN(r.minPrice) : '—'}
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums">
                  {r.variants}
                </td>
                <td
                  className={`px-[var(--space-3)] py-[var(--space-2)] text-right tabular-nums ${r.stock <= 3 ? 'text-[var(--danger)]' : ''}`}
                >
                  {r.stock}
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)]">
                  <PublishToggle productId={r.id} published={r.published} />
                </td>
                <td className="px-[var(--space-3)] py-[var(--space-2)] text-right whitespace-nowrap">
                  <Link
                    href={`/producto/${r.slug}`}
                    className="font-mono text-xs underline underline-offset-4 decoration-[var(--brass)]"
                  >
                    ver ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-[var(--space-4)] text-xs text-[var(--ink-soft)]">
        {allCats?.length ?? 0} categorías · {rows.length} piezas en el catálogo.
      </p>
    </div>
  );
}
