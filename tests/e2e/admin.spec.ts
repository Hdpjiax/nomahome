import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Fase 7 — panel del taller.
 * Requiere un admin: se crea cuenta y se promueve con el service key
 * (como hará el taller en producción desde la consola). Verifica también
 * que un usuario SIN rol admin no ve el panel.
 */
test.describe('Panel de administración', () => {
  test.beforeAll(() => {
    process.loadEnvFile('.env.local');
  });

  async function promote(email: string) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq(
        'id',
        (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users?.find(
          (u) => u.email === email
        )!.id
      )
      .maybeSingle();
    expect(data).toBeDefined();
    const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', data!.id);
    expect(error).toBeNull();
  }

  /** Limpia variantes -COPIA de corridas previas: el duplicado es determinista. */
  async function cleanCopies() {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    await admin.from('product_variants').delete().like('sku', '%-COPIA');
  }

  test('sin rol admin no se ve el panel', async ({ page }) => {
    const email = `sinrol+${Date.now()}@taller.mx`;
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Sin Rol');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('lumen2026');
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola/i })).toBeVisible();

    const res = await page.goto('/admin');
    expect(res?.status()).toBe(404);
  });

  test('admin administra catálogo, pestañas, categorías, home y reseñas', async ({ page }) => {
    const email = `jefe+${Date.now()}@taller.mx`;
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Jefe Taller');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('lumen2026');
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola, Jefe/i })).toBeVisible();
    await promote(email);
    await cleanCopies();

    // Resumen
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'El taller hoy.' })).toBeVisible();
    await expect(page.getByText('Por cobrar').first()).toBeVisible();

    // Productos: tabla densa y editor
    await page.goto('/admin/productos');
    await expect(page.getByText('CL-SOF-220').first()).toBeVisible();

    await page.getByRole('link', { name: 'Sofá Norte 220' }).click();
    await expect(page.getByRole('heading', { name: 'Sofá Norte 220' })).toBeVisible();

    // Editar stock de la primera variante y guardar
    const stockInput = page.locator('input[aria-label="Stock"]').first();
    await stockInput.fill('7');
    await page.getByRole('button', { name: 'Guardar variante' }).first().click();
    await expect(page.getByText('Variante guardada.')).toBeVisible({ timeout: 15000 });

    // Duplicar variante
    await page.getByRole('button', { name: 'duplicar' }).first().click();
    await expect(page.getByText(/duplicada/i)).toBeVisible({ timeout: 15000 });

    // Reordenar pestañas con las flechas (persiste sort_order)
    const primerTitulo = await page
      .locator('input[aria-label="Título de pestaña"]')
      .first()
      .inputValue();
    await page.getByRole('button', { name: 'Bajar pestaña' }).first().click();
    await expect(page.getByText('Orden guardado.')).toBeVisible({ timeout: 15000 });
    const ahoraSegundo = await page
      .locator('input[aria-label="Título de pestaña"]')
      .nth(1)
      .inputValue();
    expect(primerTitulo).toBe(ahoraSegundo);

    // Fotos: registrar una segunda y reordenar por ARRASTRE (§8 editor:
    // drag de pestañas y de fotos persiste orden)
    await page
      .getByPlaceholder('/brand/seed/mi-pieza.svg')
      .first()
      .fill('/brand/seed/sofa-norte-220-tinta.svg');
    await page.getByRole('button', { name: 'Agregar', exact: true }).first().click();
    await expect(page.getByText('Imagen registrada.')).toBeVisible({ timeout: 15000 });

    const fotos = page.getByTestId('variant-photos').first().locator('li');
    await expect(fotos).toHaveCount(2, { timeout: 15000 });
    const primeraAntes = await fotos.nth(0).locator('img').getAttribute('src');
    await fotos.nth(0).dispatchEvent('dragstart');
    await fotos.nth(1).dispatchEvent('drop');
    await expect(page.getByText('Orden de fotos guardado.')).toBeVisible({ timeout: 15000 });

    // El orden sobrevive la recarga: la foto arrastrada quedó al final
    await page.reload();
    const fotosTras = page.getByTestId('variant-photos').first().locator('li');
    await expect(fotosTras).toHaveCount(2, { timeout: 15000 });
    const primeraDespues = await fotosTras.locator('img').first().getAttribute('src');
    expect(primeraDespues).not.toBe(primeraAntes);

    // Categorías: mover pieza explícitamente
    await page.goto('/admin/categorias');
    await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible();
    await page
      .locator('select')
      .first()
      .selectOption({ label: 'CL-HUB-120 · Hub de cortinas motorizadas' });
    await page.getByRole('button', { name: 'Mover' }).click();
    await expect(page.getByText(/movida a/i)).toBeVisible({ timeout: 15000 });

    // Home: reordenar bloques
    await page.goto('/admin/inicio');
    await expect(page.getByRole('heading', { name: 'Bloques del home' })).toBeVisible();
    await page.getByRole('button', { name: 'Bajar bloque' }).first().click();
    await page.waitForTimeout(600);

    // Reseñas: moderar la primera pendiente si existe
    await page.goto('/admin/resenas');
    const publicar = page.getByRole('button', { name: 'Publicar' }).first();
    if (await publicar.isVisible().catch(() => false)) {
      await publicar.click();
      await expect(page.getByText('Reseña publicada.')).toBeVisible({ timeout: 15000 });
    }
  });
});
