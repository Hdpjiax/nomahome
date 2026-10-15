import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * Fase 5 — checkout, cobro SPEI y webhook firmado.
 * El flujo ejercita la regla dura: un webhook sin firma válida NUNCA
 * marca el pedido pagado (§2, §12). Corre en PAYMENTS_MODE=sandbox contra
 * el stack local.
 */
test.describe('Checkout y cobro propio por SPEI', () => {
  test.beforeAll(() => {
    process.loadEnvFile('.env.local');
  });

  const CLABE = process.env.NEXT_PUBLIC_STORE_CLABE ?? '';

  async function crearPedido(page: import('@playwright/test').Page) {
    await page.goto('/producto/buro-de-noche-tzintzuntzan');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();

    await page.goto('/checkout');
    await page.getByLabel('Nombre').fill('Comprador Invitado');
    await page.getByLabel('Correo').fill(`invitado+${Date.now()}@taller.mx`);
    await page.getByLabel('¿A quién se entrega?').fill('Comprador Invitado');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Morelia');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('58000');
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Crear pedido y transferir' }).click();

    await page.waitForURL(/\/pedido\//);
    await expect(page.getByTestId('order-status')).toHaveText('Por pagar');
    await expect(page.getByTestId('spei-clabe')).toContainText(CLABE);
    await expect(page.getByTestId('spei-ref')).toHaveText(/CL-[2-9A-HJKMNP-Z]{6}/);
    const url = new URL(page.url());
    return { orderId: url.pathname.split('/').pop() as string, page };
  }

  test('pedido invitado completo: SPEI, webhook inválido, simulación e idempotencia', async ({ page, request }) => {
    const { orderId } = await crearPedido(page);

    // El carrito se cerró con el pedido
    await page.goto('/carrito');
    await expect(page.getByText('Tu carrito está en silencio.')).toBeVisible();
    await page.goto(`/pedido/${orderId}`);
    await expect(page.getByTestId('order-status')).toHaveText('Por pagar');

    // Stock antes del pago (vía REST anónima, RLS publica)
    const before = await request.get(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/product_variants?select=stock&sku=eq.CL-BUR-070-ROB`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' } }
    );
    const stockBefore = (await before.json())[0].stock;

    // 1. Webhook SIN firma => 401 y el pedido sigue Por pagar
    const noSig = await request.post('/api/webhooks/pagos', {
      data: { public_ref: 'CL-AAAAAA', provider_payment_id: 'sim_x', status: 'approved', amount_cents: 1 },
    });
    expect(noSig.status()).toBe(401);

    // 2. Firma VÁLIDA pero monto distinto => 409, sigue Por pagar
    const ref = await page.getByTestId('spei-ref').textContent();
    const body = JSON.stringify({
      public_ref: ref,
      provider_payment_id: 'sim_monto_mal',
      status: 'approved',
      amount_cents: 999999,
    });
    const sig = createHmac('sha256', process.env.PAYMENTS_SANDBOX_SECRET ?? '')
      .update(body, 'utf8')
      .digest('hex');
    const wrongAmount = await request.post('/api/webhooks/pagos', {
      data: body,
      headers: { 'x-signature': sig },
    });
    expect(wrongAmount.status()).toBe(409);
    await page.reload();
    await expect(page.getByTestId('order-status')).toHaveText('Por pagar');

    // 3. Simulación en sandbox (firma válida, monto exacto) => Pagado
    //    El monto exacto se lee de la UI: RLS no deja leer orders desde anon.
    const amountText = (await page.getByTestId('spei-amount').textContent()) ?? '';
    const amountCents = Math.round(
      Number(amountText.replace(/[^0-9.]/g, '')) * 100
    );
    await page.getByRole('button', { name: 'Simular pago aprobado' }).click();
    await expect(page.getByTestId('order-status')).toHaveText('Pagado', { timeout: 15000 });

    // 4. Idempotencia: reintento del MISMO id de pago no descuenta stock otra vez
    const retryBody = JSON.stringify({
      public_ref: ref,
      provider_payment_id: 'sim_monto_mal', // mismo id, ahora con monto exacto
      status: 'approved',
      amount_cents: amountCents,
    });
    const retrySig = createHmac('sha256', process.env.PAYMENTS_SANDBOX_SECRET ?? '')
      .update(retryBody, 'utf8')
      .digest('hex');
    const retry = await request.post('/api/webhooks/pagos', {
      data: retryBody,
      headers: { 'x-signature': retrySig },
    });
    // El reintento con id ya aplicado responde 200/409 sin dañar nada
    expect([200, 409]).toContain(retry.status());

    // Stock: bajó exactamente 1 (la cantidad pedida), no 2
    const after = await request.get(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/product_variants?select=stock&sku=eq.CL-BUR-070-ROB`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' } }
    );
    const stockAfter = (await after.json())[0].stock;
    expect(stockAfter).toBe(stockBefore - 1);

    // El pedido pagado ya no muestra CLABE ni simulación
    await expect(page.getByTestId('spei-clabe')).toHaveCount(0);
  });

  test('un webhook firmado sobre una referencia inexistente no toca nada', async ({ request }) => {
    const body = JSON.stringify({
      public_ref: 'CL-ZZZZZZ',
      provider_payment_id: 'sim_fantasma',
      status: 'approved',
      amount_cents: 100,
    });
    const sig = createHmac('sha256', process.env.PAYMENTS_SANDBOX_SECRET ?? '')
      .update(body, 'utf8')
      .digest('hex');
    const res = await request.post('/api/webhooks/pagos', {
      data: body,
      headers: { 'x-signature': sig },
    });
    expect(res.status()).toBe(404);
  });
});
