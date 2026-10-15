'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addressSchema, profileSchema } from '@/lib/validators/address';

export type AccountState =
  | { status: 'idle' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

function fieldErrorsOf(error: { issues: { path: (string | number | symbol)[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Actualiza nombre y teléfono del profile. El rol no se toca (grants). */
export async function updateProfileAction(
  _prev: AccountState | null,
  formData: FormData
): Promise<AccountState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone') ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Revisa los datos.', fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Tu sesión expiró. Entra otra vez.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
    })
    .eq('id', user.id);
  if (error) return { status: 'error', message: 'No se pudo guardar. Inténtalo en un rato.' };

  revalidatePath('/cuenta');
  return { status: 'ok', message: 'Datos guardados.' };
}

/** Cerrar sesión desde el servidor: la cookie se invalida de verdad. */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

/** Guardar / quitar pieza de favoritos. RLS: solo las propias. */
export async function toggleFavoriteAction(
  productId: string
): Promise<{ ok: true; favorited: boolean } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Entra a tu cuenta para guardar piezas.' };

  const { data: existing } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    if (error) return { ok: false, error: 'No se pudo quitar la pieza.' };
    revalidatePath('/cuenta/favoritos');
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, product_id: productId });
  if (error) return { ok: false, error: 'No se pudo guardar la pieza.' };
  revalidatePath('/cuenta/favoritos');
  return { ok: true, favorited: true };
}

/** Alta / edición de dirección. RLS permite escribir solo las propias. */
export async function saveAddressAction(
  _prev: AccountState | null,
  formData: FormData
): Promise<AccountState> {
  const parsed = addressSchema.safeParse({
    recipient: String(formData.get('recipient') ?? ''),
    line1: String(formData.get('line1') ?? ''),
    line2: String(formData.get('line2') ?? ''),
    city: String(formData.get('city') ?? ''),
    state: String(formData.get('state') ?? ''),
    postalCode: String(formData.get('postalCode') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    isDefault: formData.get('isDefault') === 'on',
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Revisa la dirección.', fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Tu sesión expiró. Entra otra vez.' };

  const id = formData.get('id');
  const payload = {
    recipient: parsed.data.recipient,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    state: parsed.data.state,
    postal_code: parsed.data.postalCode,
    phone: parsed.data.phone,
    is_default: parsed.data.isDefault ?? false,
  };

  let error;
  if (id) {
    ({ error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', String(id))
      .eq('user_id', user.id));
  } else {
    ({ error } = await supabase
      .from('addresses')
      .insert({ ...payload, user_id: user.id }));
  }
  if (error) return { status: 'error', message: 'No se pudo guardar la dirección.' };

  // Si marcó esta como predeterminada, quitamos la bandera de las demás.
  if (payload.is_default) {
    const { data: all } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .neq('is_default', false);
    for (const row of all ?? []) {
      if (row.id !== id) {
        await supabase.from('addresses').update({ is_default: false }).eq('id', row.id);
      }
    }
  }

  revalidatePath('/cuenta/direcciones');
  revalidatePath('/checkout');
  return { status: 'ok', message: 'Dirección guardada.' };
}

export async function deleteAddressAction(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/cuenta/direcciones');
}

/** Direcciones del usuario (solo sus propias, por RLS). */
export async function listAddresses() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(`addresses: ${error.message}`);
  return data ?? [];
}
