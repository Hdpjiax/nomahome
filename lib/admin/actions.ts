'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertAdmin } from '@/lib/admin/guard';
import { productSchema } from '@/lib/validators/product';

/**
 * Mutaciones del panel de administración. TODAS verifican rol admin en
 * servidor y dejan rastro en audit_logs (§6 admin skill).
 */

export type AdminState =
  | { status: 'idle' }
  | { status: 'ok'; message: string; productId?: string }
  | { status: 'error'; message: string };

async function audit(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null
) {
  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
  });
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function saveProductAction(
  productId: string | null,
  input: import('@/lib/validators/product').ProductInput
): Promise<AdminState> {
  let actorId: string;
  try {
    const user = await assertAdmin();
    actorId = user.id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }

  const admin = createAdminClient();
  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    sku: parsed.data.sku,
    summary: parsed.data.summary || null,
    description: parsed.data.description || null,
    video_url: parsed.data.videoUrl || null,
    seo_title: parsed.data.seoTitle || null,
    seo_description: parsed.data.seoDescription || null,
    published: parsed.data.published,
  };

  let id = productId;
  try {
    if (productId) {
      const { error } = await admin.from('products').update(data).eq('id', productId);
      if (error) throw error;
    } else {
      const { data: created, error } = await admin
        .from('products')
        .insert(data)
        .select('id')
        .single();
      if (error) throw error;
      id = created.id;
    }
    const productId_ = id as string;

    // Categorías: reemplazo completo (acción explícita, con bitácora).
    const { data: allCats } = await admin.from('categories').select('id, slug');
    const bySlug = new Map((allCats ?? []).map((c) => [c.slug, c.id]));
    const wanted = parsed.data.categorySlugs
      .map((s) => bySlug.get(s))
      .filter((v): v is string => Boolean(v));
    await admin.from('product_categories').delete().eq('product_id', productId_);
    if (wanted.length > 0) {
      const { error: catError } = await admin
        .from('product_categories')
        .insert(wanted.map((cid) => ({ product_id: productId_, category_id: cid })));
      if (catError) throw catError;
    }

    await audit(admin, actorId, productId ? 'product.updated' : 'product.created', 'products', productId_);

    revalidatePath('/admin/productos');
    revalidatePath(`/admin/productos/${productId_}`);
    revalidatePath('/');
    return { status: 'ok', message: 'Pieza guardada.', productId: productId_ };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    const friendly = msg.includes('duplicate')
      ? 'Ese slug o SKU ya existe en el catálogo.'
      : 'No se pudo guardar la pieza.';
    return { status: 'error', message: friendly };
  }
}

export async function toggleProductPublishedAction(
  productId: string,
  published: boolean
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('products')
    .update({ published })
    .eq('id', productId);
  if (error) return { status: 'error', message: 'No se pudo cambiar el estado.' };
  await audit(admin, actorId, published ? 'product.published' : 'product.unpublished', 'products', productId);
  revalidatePath('/admin/productos');
  revalidatePath('/');
  return { status: 'ok', message: published ? 'Pieza publicada.' : 'Pieza fuera de vitrina.' };
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

export async function saveVariantAction(
  variantId: string | null,
  productId: string,
  input: {
    sku: string;
    colorId: string;
    material: string;
    widthCm: number | null;
    depthCm: number | null;
    heightCm: number | null;
    weightKg: number | null;
    priceCents: number;
    compareAtCents: number | null;
    stock: number;
    published: boolean;
  }
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  if (!Number.isSafeInteger(input.priceCents) || input.priceCents < 0) {
    return { status: 'error', message: 'Precio en centavos enteros.' };
  }
  if (!Number.isSafeInteger(input.stock) || input.stock < 0) {
    return { status: 'error', message: 'Stock entero no negativo.' };
  }

  const admin = createAdminClient();
  const data = {
    product_id: productId,
    sku: input.sku.toUpperCase(),
    color_id: input.colorId,
    material: input.material,
    width_cm: input.widthCm,
    depth_cm: input.depthCm,
    height_cm: input.heightCm,
    weight_kg: input.weightKg,
    price_cents: input.priceCents,
    compare_at_cents: input.compareAtCents,
    stock: input.stock,
    published: input.published,
  };

  try {
    if (variantId) {
      const { error } = await admin.from('product_variants').update(data).eq('id', variantId);
      if (error) throw error;
    } else {
      const { error } = await admin.from('product_variants').insert(data);
      if (error) throw error;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return {
      status: 'error',
      message: msg.includes('duplicate') ? 'Ese SKU de variante ya existe.' : 'No se pudo guardar la variante.',
    };
  }

  await audit(admin, actorId, variantId ? 'variant.updated' : 'variant.created', 'product_variants', variantId);
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath('/');
  return { status: 'ok', message: 'Variante guardada.' };
}

/** Duplicar variante: copia con SKU nuevo y stock 0 (§8 admin). */
export async function duplicateVariantAction(variantId: string): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { data: variant } = await admin
    .from('product_variants')
    .select('*')
    .eq('id', variantId)
    .maybeSingle();
  if (!variant) return { status: 'error', message: 'Variante no encontrada.' };

  const { data: copy, error } = await admin
    .from('product_variants')
    .insert({
      product_id: variant.product_id,
      sku: `${variant.sku}-COPIA`,
      color_id: variant.color_id,
      material: variant.material,
      width_cm: variant.width_cm,
      depth_cm: variant.depth_cm,
      height_cm: variant.height_cm,
      weight_kg: variant.weight_kg,
      price_cents: variant.price_cents,
      compare_at_cents: variant.compare_at_cents,
      stock: 0,
      published: false,
    })
    .select('id')
    .single();
  if (error) return { status: 'error', message: 'No se pudo duplicar.' };

  await audit(admin, actorId, 'variant.duplicated', 'product_variants', copy.id);
  revalidatePath(`/admin/productos/${variant.product_id}`);
  return { status: 'ok', message: 'Variante duplicada con stock 0 y sin publicar.' };
}

export async function deleteVariantAction(variantId: string): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { data: variant } = await admin
    .from('product_variants')
    .select('product_id')
    .eq('id', variantId)
    .maybeSingle();
  const { error } = await admin.from('product_variants').delete().eq('id', variantId);
  if (error) return { status: 'error', message: 'No se pudo quitar la variante.' };
  await audit(admin, actorId, 'variant.deleted', 'product_variants', variantId);
  if (variant) revalidatePath(`/admin/productos/${variant.product_id}`);
  return { status: 'ok', message: 'Variante fuera del catálogo.' };
}

// ---------------------------------------------------------------------------
// Media: subida a storage product-media + renglones en product_media
// ---------------------------------------------------------------------------

export async function uploadMediaAction(
  variantId: string,
  file: File,
  alt: string
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  if (file.size === 0) return { status: 'error', message: 'Elige un archivo.' };
  if (file.size > 5 * 1024 * 1024) {
    return { status: 'error', message: 'Máximo 5 MB por imagen.' };
  }
  if (!/^image\/(png|jpe?g|webp|avif|svg\+xml)$/.test(file.type)) {
    return { status: 'error', message: 'Solo PNG, JPG, WebP, AVIF o SVG.' };
  }

  const admin = createAdminClient();
  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `piezas/${variantId}/${Date.now()}.${ext}`;
  const { error: upError } = await admin.storage
    .from('product-media')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (upError) return { status: 'error', message: 'La subida falló.' };

  const publicUrl = admin.storage.from('product-media').getPublicUrl(path).data.publicUrl;
  const { error: rowError } = await admin.from('product_media').insert({
    variant_id: variantId,
    path: publicUrl,
    alt: alt || 'Pieza del taller',
    width: null,
    height: null,
    sort_order: 99,
  });
  if (rowError) return { status: 'error', message: 'La imagen subió pero no se registró.' };

  await audit(admin, actorId, 'media.uploaded', 'product_media', variantId);
  revalidatePath('/');
  return { status: 'ok', message: 'Imagen en el bucket product-media.' };
}

/** Registrar una pieza ya existente (p. ej. SVG del seed en /public). */
export async function addMediaPathAction(
  variantId: string,
  path: string,
  alt: string
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  if (!path.startsWith('/brand/') && !path.startsWith('http')) {
    return { status: 'error', message: 'Ruta relativa al repo (/brand/...) o URL completa.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('product_media').insert({
    variant_id: variantId,
    path,
    alt: alt || 'Pieza del taller',
    sort_order: 99,
  });
  if (error) return { status: 'error', message: 'No se pudo registrar la imagen.' };
  await audit(admin, actorId, 'media.path_added', 'product_media', variantId);
  revalidatePath('/');
  return { status: 'ok', message: 'Imagen registrada.' };
}

export async function moveMediaAction(mediaId: string, direction: -1 | 1): Promise<void> {
  try {
    await assertAdmin();
  } catch {
    return;
  }
  const admin = createAdminClient();
  const { data: media } = await admin
    .from('product_media')
    .select('id, variant_id, sort_order')
    .eq('id', mediaId)
    .maybeSingle();
  if (!media) return;

  const { data: siblings } = await admin
    .from('product_media')
    .select('id, sort_order')
    .eq('variant_id', media.variant_id)
    .order('sort_order');
  const list = siblings ?? [];
  const idx = list.findIndex((m) => m.id === mediaId);
  const swapIdx = idx + direction;
  if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;

  await admin
    .from('product_media')
    .update({ sort_order: list[swapIdx].sort_order })
    .eq('id', list[idx].id);
  await admin
    .from('product_media')
    .update({ sort_order: list[idx].sort_order })
    .eq('id', list[swapIdx].id);
  revalidatePath('/');
}

export async function deleteMediaAction(mediaId: string): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('product_media').delete().eq('id', mediaId);
  if (error) return { status: 'error', message: 'No se pudo quitar la imagen.' };
  await audit(admin, actorId, 'media.deleted', 'product_media', mediaId);
  revalidatePath('/');
  return { status: 'ok', message: 'Imagen fuera de la galería.' };
}

// ---------------------------------------------------------------------------
// Pestañas de la ficha: alta, edición, reorden (drag persiste sort_order)
// ---------------------------------------------------------------------------

export async function saveTabAction(
  tabId: string | null,
  productId: string,
  title: string,
  body: string
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  if (title.trim().length < 2) return { status: 'error', message: 'Título de la pestaña.' };

  const admin = createAdminClient();
  if (tabId) {
    const { error } = await admin
      .from('product_tabs')
      .update({ title: title.trim(), body })
      .eq('id', tabId);
    if (error) return { status: 'error', message: 'No se pudo guardar la pestaña.' };
  } else {
    const { count } = await admin
      .from('product_tabs')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);
    const { error } = await admin.from('product_tabs').insert({
      product_id: productId,
      title: title.trim(),
      body,
      sort_order: count ?? 0,
    });
    if (error) return { status: 'error', message: 'No se pudo crear la pestaña.' };
  }
  await audit(admin, actorId, 'tab.saved', 'product_tabs', tabId);
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath('/');
  return { status: 'ok', message: 'Pestaña guardada.' };
}

export async function reorderTabsAction(productId: string, orderedIds: string[]): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await admin
      .from('product_tabs')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('product_id', productId); // no toca pestañas ajenas
  }
  await audit(admin, actorId, 'tab.reordered', 'products', productId);
  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath('/');
  return { status: 'ok', message: 'Orden guardado.' };
}

export async function deleteTabAction(tabId: string, productId: string): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('product_tabs').delete().eq('id', tabId);
  if (error) return { status: 'error', message: 'No se pudo quitar la pestaña.' };
  await audit(admin, actorId, 'tab.deleted', 'product_tabs', tabId);
  revalidatePath(`/admin/productos/${productId}`);
  return { status: 'ok', message: 'Pestaña fuera.' };
}

// ---------------------------------------------------------------------------
// Categorías: crear, renombrar, reordenar y MOVER producto (acción
// explícita con bitácora, §6 admin skill)
// ---------------------------------------------------------------------------

export async function saveCategoryAction(
  categoryId: string | null,
  slug: string,
  name: string,
  description: string
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const data = {
    slug: slug.trim().toLowerCase(),
    name: name.trim(),
    description: description.trim() || null,
  };
  try {
    if (categoryId) {
      const { error } = await admin.from('categories').update(data).eq('id', categoryId);
      if (error) throw error;
    } else {
      const { count } = await admin
        .from('categories')
        .select('id', { count: 'exact', head: true });
      const { error } = await admin
        .from('categories')
        .insert({ ...data, sort_order: count ?? 0 });
      if (error) throw error;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    return {
      status: 'error',
      message: msg.includes('duplicate') ? 'Ese slug de categoría ya existe.' : 'No se pudo guardar.',
    };
  }
  await audit(admin, actorId, 'category.saved', 'categories', categoryId);
  revalidatePath('/admin/categorias');
  revalidatePath('/');
  return { status: 'ok', message: 'Categoría guardada.' };
}

export async function reorderCategoryAction(
  categoryId: string,
  direction: -1 | 1
): Promise<void> {
  try {
    await assertAdmin();
  } catch {
    return;
  }
  const admin = createAdminClient();
  const { data: list } = await admin
    .from('categories')
    .select('id, sort_order')
    .order('sort_order');
  const arr = list ?? [];
  const idx = arr.findIndex((c) => c.id === categoryId);
  const swapIdx = idx + direction;
  if (idx < 0 || swapIdx < 0 || swapIdx >= arr.length) return;
  await admin.from('categories').update({ sort_order: arr[swapIdx].sort_order }).eq('id', arr[idx].id);
  await admin.from('categories').update({ sort_order: arr[idx].sort_order }).eq('id', arr[swapIdx].id);
  revalidatePath('/admin/categorias');
  revalidatePath('/');
}

/** Mover un producto de categoría: acción EXPLÍCITA con bitácora (§6). */
export async function moveProductCategoryAction(
  productId: string,
  toCategorySlug: string,
  alsoRemoveSlug?: string
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { data: toCat } = await admin
    .from('categories')
    .select('id, name')
    .eq('slug', toCategorySlug)
    .maybeSingle();
  if (!toCat) return { status: 'error', message: 'Categoría destino no existe.' };

  if (alsoRemoveSlug) {
    const { data: fromCat } = await admin
      .from('categories')
      .select('id')
      .eq('slug', alsoRemoveSlug)
      .maybeSingle();
    if (fromCat) {
      await admin
        .from('product_categories')
        .delete()
        .eq('product_id', productId)
        .eq('category_id', fromCat.id);
    }
  }

  const { error } = await admin
    .from('product_categories')
    .upsert({ product_id: productId, category_id: toCat.id }, { onConflict: 'product_id,category_id' });
  if (error) return { status: 'error', message: 'No se pudo mover la pieza.' };

  await audit(admin, actorId, 'product.moved_category', 'products', productId);
  revalidatePath('/admin/categorias');
  revalidatePath('/');
  return { status: 'ok', message: `Pieza movida a ${toCat.name}.` };
}

// ---------------------------------------------------------------------------
// Bloques del home: reorden y edición ligera
// ---------------------------------------------------------------------------

export async function moveHomeBlockAction(blockId: string, direction: -1 | 1): Promise<void> {
  try {
    await assertAdmin();
  } catch {
    return;
  }
  const admin = createAdminClient();
  const { data: list } = await admin
    .from('homepage_blocks')
    .select('id, sort_order')
    .order('sort_order');
  const arr = list ?? [];
  const idx = arr.findIndex((b) => b.id === blockId);
  const swapIdx = idx + direction;
  if (idx < 0 || swapIdx < 0 || swapIdx >= arr.length) return;
  await admin.from('homepage_blocks').update({ sort_order: arr[swapIdx].sort_order }).eq('id', arr[idx].id);
  await admin.from('homepage_blocks').update({ sort_order: arr[idx].sort_order }).eq('id', arr[swapIdx].id);
  revalidatePath('/admin/inicio');
  revalidatePath('/');
}

export async function saveHomeBlockAction(
  blockId: string,
  title: string,
  body: string,
  published: boolean
): Promise<AdminState> {
  let actorId: string;
  try {
    actorId = (await assertAdmin()).id;
  } catch {
    return { status: 'error', message: 'No tienes permiso de taller.' };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('homepage_blocks')
    .update({ title: title.trim(), body: body.trim() || null, published })
    .eq('id', blockId);
  if (error) return { status: 'error', message: 'No se pudo guardar el bloque.' };
  await audit(admin, actorId, 'home_block.saved', 'homepage_blocks', blockId);
  revalidatePath('/admin/inicio');
  revalidatePath('/');
  return { status: 'ok', message: 'Bloque guardado.' };
}
