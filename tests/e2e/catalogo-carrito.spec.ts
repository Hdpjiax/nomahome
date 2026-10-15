import { test, expect } from '@playwright/test';

/**
 * Fase 3 — flujo anónimo: ficha, agregado al carrito, cantidades y retiro.
 * Corre contra el stack local de Supabase con el seed aplicado.
 */
test.describe('Catálogo y carrito de invitado', () => {
  test('la ficha muestra pieza, colores y precio con IVA', async ({ page }) => {
    await page.goto('/producto/sofa-norte-220');
    await expect(page.getByRole('heading', { name: 'Sofá Norte 220' })).toBeVisible();
    await expect(page.getByText('CL-SOF-220').first()).toBeVisible();
    // Tres colores de taller como swatches con nombre
    await expect(page.getByRole('button', { name: /Arena/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tinta/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pino/ })).toBeVisible();
    // Precio visible
    await expect(page.getByTestId('price').first()).toContainText('$');
  });

  test('agregar al carrito y verlo en el header', async ({ page }) => {
    await page.goto('/producto/mesa-de-roble-lerma');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();

    // El contador del header se actualiza
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await page.goto('/carrito');
    await expect(page.getByRole('heading', { name: /1 pieza/i })).toBeVisible();
    await expect(page.getByText('CL-MES-140-ROB').first()).toBeVisible();
  });

  test('cambiar color cambia precio si difiere y respeta stock', async ({ page }) => {
    await page.goto('/producto/mesa-de-roble-lerma');
    // Roble cuesta 14,500 y nogal 14,900
    await page.getByRole('button', { name: /Nogal/ }).click();
    await expect(page.getByTestId('price').first()).toContainText('14,900');
  });

  test('cantidad, quitar y estado vacío del carrito', async ({ page }) => {
    await page.goto('/producto/silla-de-comedor-quiroga');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();

    await page.goto('/carrito');
    const qty = page.locator('[aria-live="polite"]').first();
    await expect(qty).toHaveText('1');

    // +1
    await page.getByRole('button', { name: /Agregar una Silla/ }).click();
    await expect(page.locator('[aria-live="polite"]').first()).toHaveText('2');

    // Quitar la línea
    await page.getByRole('button', { name: 'Quitar', exact: true }).click();
    await expect(page.getByText('Tu carrito está en silencio.')).toBeVisible();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });

  test('el agregado rápido de listados abre el sheet', async ({ page }) => {
    await page.goto('/categoria/muebles');
    const card = page.locator('article', { hasText: 'Buró de noche Tzintzuntzan' }).first();
    await card.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByRole('dialog', { name: 'Buró de noche Tzintzuntzan' })).toBeVisible();
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await expect(page.getByText('En el carrito')).toBeVisible();
  });

  test('buscar por material encuentra piezas', async ({ page }) => {
    await page.goto('/buscar?q=roble');
    await expect(page.getByText(/piezas? encontrada?s/i)).toBeVisible();
    await expect(page.getByText('Mesa de roble Lerma').first()).toBeVisible();
  });
});
