'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { reviewSchema } from '@/lib/validators';

export type ReviewState =
  | { status: 'idle' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string };

/**
 * Publicar reseña (§8 reseñas): solo un usuario con pedido pagado de esa
 * variante. El servidor verifica el pedido; RLS lo exige de nuevo en la
 * base. La reseña nace pending y el admin la moderará.
 */
export async function submitReviewAction(
  variantId: string,
  orderId: string,
  rating: number,
  title: string,
  body: string
): Promise<ReviewState> {
  const user = await getSessionUser();
  if (!user) return { status: 'error', message: 'Entra a tu cuenta para reseñar.' };

  const parsed = reviewSchema.safeParse({ rating, title, body });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }

  // 1. El pedido es suyo y está pagado (verificación en servidor).
  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, status, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id || order.status !== 'paid') {
    return { status: 'error', message: 'Solo se reseñan piezas de pedidos pagados.' };
  }

  // 2. El pedido contiene esa variante.
  const { data: line } = await admin
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('variant_id', variantId)
    .maybeSingle();
  if (!line) {
    return { status: 'error', message: 'Esa pieza no viene en este pedido.' };
  }

  // 3. Una reseña por pieza y pedido.
  const { data: existing } = await admin
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('variant_id', variantId)
    .eq('order_id', orderId)
    .maybeSingle();
  if (existing) {
    return { status: 'error', message: 'Ya escribiste la reseña de esta pieza.' };
  }

  // 4. author_name lo fija el servidor desde el profile: no se falsifica.
  const profile = await getProfile();
  const authorName = profile?.fullName?.split(' ')[0] ?? 'Cliente';

  // 5. Insert con la sesión del usuario: RLS exige compra verificada.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('reviews').insert({
    variant_id: variantId,
    user_id: user.id,
    order_id: orderId,
    rating: parsed.data.rating,
    title: parsed.data.title || '',
    body: parsed.data.body,
    author_name: authorName,
    status: 'pending',
  });
  if (error) {
    if (error.code === '42501') {
      return {
        status: 'error',
        message: 'La reseña no pasa la verificación de compra para esta pieza.',
      };
    }
    return { status: 'error', message: 'No se pudo guardar la reseña. Inténtalo en un rato.' };
  }

  revalidatePath(`/pedido/${orderId}`);
  revalidatePath('/resenas');
  return { status: 'ok', message: 'Reseña en revisión del taller. Aparece cuando se publique.' };
}

/** Reseñas del usuario para un pedido (ve las pendientes propias). */
export async function getMyReviewsForOrder(orderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, variant_id, rating, title, body, status')
    .eq('order_id', orderId);
  if (error) return [];
  return data ?? [];
}

/**
 * Moderación (fase 7 admin): publicar o rechazar. Solo admin, verificado
 * en servidor; RLS solo permite update de reviews a admin.
 */
export async function moderateReviewAction(
  reviewId: string,
  decision: 'published' | 'rejected'
): Promise<{ message: string }> {
  const user = await getSessionUser();
  if (!user) return { message: 'Solo el taller.' };
  const profile = await getProfile();
  if (profile?.role !== 'admin') return { message: 'Solo el taller.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('reviews')
    .update({ status: decision })
    .eq('id', reviewId);
  if (error) return { message: 'No se pudo moderar.' };

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `review.${decision}`,
    entity: 'reviews',
    entity_id: reviewId,
  });

  revalidatePath('/resenas');
  revalidatePath('/admin/resenas');
  return { message: decision === 'published' ? 'Reseña publicada.' : 'Reseña rechazada.' };
}
