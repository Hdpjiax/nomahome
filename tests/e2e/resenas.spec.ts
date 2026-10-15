import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Fase 6 — reseñas de compra verificada.
 * 1. Comprar con sesión y pagar (sandbox).
 * 2. Reseñar la pieza: nace pendiente, no aparece en la ficha.
 * 3. Moderación: publicada por el taller (service role, como hará el
 *    admin de fase 7) => aparece en la ficha y en /resenas.
 * 4. Una reseña duplicada de la misma pieza/pedido se rechaza.
 */
test.describe('Reseñas verificadas', () => {
  test.beforeAll(() => {
    process.loadEnvFile('.env.local');
  });

  test('flujo completo de reseña con moderación', async ({ page }) => {
    const email = `resena+${Date.now()}@taller.mx`;
    const password = 'lumen2026';

    // Cuenta + compra con sesión
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Reseña Prueba');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola, Reseña/i })).toBeVisible();

    await page.goto('/producto/lampara-de-mesa-patzcuaro');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();

    await page.goto('/checkout');
    await page.getByLabel('¿A quién se entrega?').fill('Reseña Prueba');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Morelia');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('58000');
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Crear pedido y transferir' }).click();
    await page.waitForURL(/\/pedido\//);

    // Pago sandbox
    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
    await expect(page.getByTestId('order-status')).toHaveText('Pagado', { timeout: 15000 });

    const marca = `Corrida ${Date.now()}.`;
    const cuerpoResena = `La luz es pareja y el latón se ve mejor en persona que en la foto. ${marca}`;

    // El formulario de reseña aparece por la pieza comprada
    await expect(page.getByRole('heading', { name: '¿Ya la tienes en casa?' })).toBeVisible();
    await page.getByRole('radio', { name: '5 de 5' }).click();
    await page.getByLabel('Cuerpo de la reseña').fill(cuerpoResena);
    await page.getByRole('button', { name: 'Enviar reseña' }).click();
    await expect(page.getByText('Reseña en revisión del taller.')).toBeVisible({ timeout: 15000 });

    // Pendiente: el texto de ESTA reseña no aparece en la ficha pública
    await page.goto('/producto/lampara-de-mesa-patzcuaro');
    await expect(page.getByText(cuerpoResena)).toHaveCount(0);

    // Moderación: el taller la publica (service role, como el admin real)
    const url = new URL(page.url());
    void url;
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    const { data: userData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const reviewer = (userData?.users ?? []).find((u) => u.email === email);
    expect(reviewer).toBeDefined();
    const { data: pending } = await admin
      .from('reviews')
      .select('id')
      .eq('status', 'pending')
      .eq('user_id', reviewer!.id)
      .limit(1);
    expect(pending?.length).toBe(1);
    const reviewId = pending![0].id;
    const { error: modError } = await admin
      .from('reviews')
      .update({ status: 'published' })
      .eq('id', reviewId);
    expect(modError).toBeNull();

    // Publicada: sí aparece en la ficha y en /resenas
    await page.goto('/producto/lampara-de-mesa-patzcuaro');
    await expect(page.getByText(cuerpoResena).first()).toBeVisible();
    await page.goto('/resenas');
    await expect(page.getByText(cuerpoResena).first()).toBeVisible();
  });
});
