// Tipos de dominio del catálogo — derivados de las filas de la base
// (lib/supabase/database.types.ts) pero con la forma que usa la tienda.

export type CatalogColor = { name: string; hex: string };

export type CatalogMedia = {
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type CatalogVariant = {
  id: string;
  sku: string;
  material: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  color: CatalogColor;
  dimensions: {
    widthCm: number | null;
    depthCm: number | null;
    heightCm: number | null;
    weightKg: number | null;
  };
  media: CatalogMedia[];
};

export type CatalogPiece = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  summary: string | null;
  categories: { slug: string; name: string }[];
  variants: CatalogVariant[];
  /** Precio de vitrina: el más bajo entre sus variantes. IVA incluido. */
  priceCents: number;
  compareAtCents: number | null;
  colors: CatalogColor[];
  materials: string[];
  inStock: boolean;
};

export type CategoryFilter = {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
};

export type SortOrder = 'reciente' | 'precio-asc' | 'precio-desc' | 'nombre';

export type CatalogFilters = {
  color?: string;
  material?: string;
  priceMinCents?: number;
  priceMaxCents?: number;
  orden?: SortOrder;
};
