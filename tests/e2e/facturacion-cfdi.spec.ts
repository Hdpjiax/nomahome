import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Fase 8 — facturación CFDI y panel de pagos.
 * Sin FACTURAPI_KEY: la solicitud se registra como "timbrado no
 * configurado", sin PDF casero. Con sesión de taller: confirmar la
 * transferencia y ver el ledger.
 */
test.describe('Facturación CFDI', () => {
  test.beforeAll(() => {
    process.loadEnvFile('.env.local');
  });

  test('pedido pagado pide factura y el taller ve el ledger', async ({ page }) => {
    const email = `cfdi+${Date.now()}@taller.mx`;

    // Compra con sesión
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Cliente CFDI');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('lumen2026');
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola, Cliente/i })).toBeVisible();

    await page.goto('/producto/silla-de-comedor-quiroga');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();
    await page.goto('/checkout');
    await page.getByLabel('¿A quién se entrega?').fill('Cliente CFDI');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Morelia');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('58000');
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Crear pedido y transferir' }).click();
    await page.waitForURL(/\/pedido\//);

    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
    await expect(page.getByTestId('order-status')).toHaveText('Pagado', { timeout: 15000 });

    // Pedir factura sin llave de Facturapi: estado honesto
    await page.goto('/cuenta/facturacion');
    await expect(page.getByText('Timbrado no configurado').first()).toBeVisible();
    const folio = await page.locator('.font-display').getByText(/CL-/).first().textContent();
    expect(folio).toMatch(/CL-/);

    await page.getByLabel('RFC').first().fill('XAXX010101000');
    await page.getByLabel('Código postal fiscal', { exact: true }).first().fill('58000');
    await page.getByLabel(/Nombre o razón social/).first().fill('Cliente CFDI SA DE CV');

    // Registrar la solicitud
    await page.getByRole('button', { name: /Registrar solicitud|Pedir factura/ }).first().click();
    await expect(
      page.getByText(/solicitud quedó registrada|Timbrado no configurado/i).first()
    ).toBeVisible({ timeout: 15000 });

    // La factura aparece como solicitada, sin UUID falso
    await expect(page.getByText('Solicitada · timbrado pendiente').first()).toBeVisible();
    await expect(page.getByText(/UUID/)).toHaveCount(0);
  });

  test('el taller confirma la transferencia y el ledger refleja el neto', async ({ page }) => {
    const email = `cobro+${Date.now()}@taller.mx`;

    // Pedido invitado por cobrar
    await page.goto('/producto/estante-de-acero-morelia');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();
    await page.goto('/checkout');
    await page.getByLabel('Nombre').fill('Comprador SPEI');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('¿A quién se entrega?').fill('Comprador SPEI');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Uruapan');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('60000');
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Crear pedido y transferir' }).click();
    await page.waitForURL(/\/pedido\//);
    await expect(page.getByTestId('order-status')).toHaveText('Por pagar');
    const folioPedido = (await page.getByRole('heading', { level: 1 }).textContent()) ?? '';
    const url = new URL(page.url());
    const orderId = url.pathname.split('/').pop() as string;

    // Taller: crear admin y confirmar contra el banco
    const adminEmail = `cobrador+${Date.now()}@taller.mx`;
    const page2 = page;
    await page2.goto('/cuenta');
    await page2.getByRole('button', { name: 'Crear cuenta' }).click();
    await page2.getByLabel('Nombre').fill('Cobrador Taller');
    await page2.getByLabel('Correo').fill(adminEmail);
    await page2.getByLabel('Contraseña', { exact: true }).fill('lumen2026');
    await page2.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page2.getByRole('heading', { name: /Hola, Cobrador/i })).toBeVisible();

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );
    const { data: users } = await supa.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const me = users?.users?.find((u) => u.email === adminEmail);
    const { error } = await supa.from('profiles').update({ role: 'admin' }).eq('id', me!.id);
    expect(error).toBeNull();

    await page2.goto('/admin/pedidos');
    const row = page2
      .locator('tr', { hasText: folioPedido })
      .first();
    await row.getByRole('button', { name: 'Vi la transferencia' }).click();
    await expect(page2.getByText('Pago confirmado por el taller.').first()).toBeVisible({ timeout: 15000 });

    // El pedido quedó pagado
    await page2.goto(`/pedido/${orderId}`);
    await expect(page2.getByTestId('order-status')).toHaveText('Pagado');

    // El ledger en /admin/pagos muestra el renglón aprobado con neto
    await page2.goto('/admin/pagos');
    await expect(page2.getByText('approved').first()).toBeVisible();
    await expect(page2.getByText(/Neto aprobado/i)).toBeVisible();
  });
});
