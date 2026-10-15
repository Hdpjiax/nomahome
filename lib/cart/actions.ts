'use server';

import { revalidatePath } from 'next/cache';
import { addToCart, removeItem, setItemQty } from './service';

export type CartActionState =
  | { status: 'idle' }
  | { status: 'ok'; message: string; cartCount: number }
  | { status: 'error'; message: string; cartCount: number };

export async function addToCartAction(
  variantId: string,
  qty: number
): Promise<CartActionState> {
  try {
    const result = await addToCart(variantId, qty);
    if (!result.ok) return { status: 'error', message: result.error, cartCount: 0 };
    revalidatePath('/carrito');
    return { status: 'ok', message: 'En el carrito.', cartCount: result.cartCount };
  } catch {
    return {
      status: 'error',
      message: 'No se pudo agregar la pieza. Inténtalo otra vez.',
      cartCount: 0,
    };
  }
}

export async function setItemQtyAction(itemId: string, qty: number): Promise<CartActionState> {
  try {
    const result = await setItemQty(itemId, qty);
    revalidatePath('/carrito');
    if (!result.ok) return { status: 'error', message: result.error, cartCount: result.cartCount };
    return { status: 'ok', message: 'Carrito actualizado.', cartCount: result.cartCount };
  } catch {
    return {
      status: 'error',
      message: 'No se pudo cambiar la cantidad.',
      cartCount: 0,
    };
  }
}

export async function removeItemAction(itemId: string): Promise<CartActionState> {
  try {
    const result = await removeItem(itemId);
    revalidatePath('/carrito');
    if (!result.ok) return { status: 'error', message: result.error, cartCount: result.cartCount };
    return { status: 'ok', message: 'Pieza fuera del carrito.', cartCount: result.cartCount };
  } catch {
    return { status: 'error', message: 'No se pudo quitar la pieza.', cartCount: 0 };
  }
}

/**
 * Variantes para <form action={...}>: React exige que la acción de un
 * formulario devuelva void. Reciben FormData como último argumento
 * (lo agrega React al hacer submit) y no lo usan.
 */
export async function setItemQtyFormAction(
  itemId: string,
  qty: number,
  _formData: FormData
): Promise<void> {
  await setItemQtyAction(itemId, qty);
}

export async function removeItemFormAction(
  itemId: string,
  _formData: FormData
): Promise<void> {
  await removeItemAction(itemId);
}
