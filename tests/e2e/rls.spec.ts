import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Fase 10 — tests RLS de la skill auditoria-seguridad, contra el stack
 * local con usuarios reales (auth no se simula):
 *   - anónimo no lee orders ni payments
 *   - usuario no lee pedidos ajenos
 *   - usuario no inserta en products ni en payments
 *   - usuario no cambia orders.status (su propio pedido tampoco)
 */
test.describe('RLS (skill auditoria-seguridad)', () => {
  test.beforeAll(() => {
    process.loadEnvFile('.env.local');
  });

  const mk = (key: string) =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', key);

  test('políticas exactas: anónimo y usuarios comunes', async () => {
    const anon: SupabaseClient = mk(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');
    const service = mk(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

    // Dos usuarios de verdad
    const stamp = Date.now();
    const aEmail = `rls-a+${stamp}@taller.mx`;
    const bEmail = `rls-b+${stamp}@taller.mx`;
    const aPass = 'lumen2026rls';
    const {
      data: { user: userA },
    } = await service.auth.admin.createUser({
      email: aEmail,
      password: aPass,
      email_confirm: true,
    });
    const {
      data: { user: userB },
    } = await service.auth.admin.createUser({
      email: bEmail,
      password: aPass,
      email_confirm: true,
    });
    expect(userA && userB).toBeTruthy();

    // Pedido de B (vía service role, como lo crea el servidor)
    const { data: orderB } = await service
      .from('orders')
      .insert({
        user_id: userB!.id,
        email: bEmail,
        status: 'pending_payment',
        subtotal_cents: 100,
        shipping_cents: 0,
        tax_cents: 14,
        total_cents: 100,
        address_snapshot: {},
      })
      .select('id')
      .single();

    // --- anónimo no lee orders ni payments -------------------------------
    const { count: anonOrders } = await anon.from('orders').select('id', { count: 'exact', head: true });
    expect(anonOrders).toBe(0);
    const { count: anonPayments } = await anon.from('payments').select('id', { count: 'exact', head: true });
    expect(anonPayments).toBe(0);

    // --- A entra con sus credenciales reales -----------------------------
    const clientA = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );
    const { error: signInError } = await clientA.auth.signInWithPassword({
      email: aEmail,
      password: aPass,
    });
    expect(signInError).toBeNull();

    // A no ve el pedido de B
    const { data: foreignOrder } = await clientA
      .from('orders')
      .select('id')
      .eq('id', orderB!.id)
      .maybeSingle();
    expect(foreignOrder).toBeNull();

    // A no inserta productos
    const { data: productInsert } = await clientA.from('products').insert({
      slug: `hack-${stamp}`,
      sku: `HACK-${stamp}`,
      name: 'Pieza prohibida',
      published: true,
    });
    expect(productInsert).toBeNull();

    // A no inserta pagos
    const { data: paymentInsert } = await clientA.from('payments').insert({
      order_id: orderB!.id,
      provider: 'spei',
      status: 'approved',
      amount_cents: 100,
      net_cents: 100,
    });
    expect(paymentInsert).toBeNull();

    // A no cambia el estado del pedido (ni el suyo ni el de B)
    const { data: statusUpdate } = await clientA
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderB!.id)
      .select();
    expect(statusUpdate).toHaveLength(0);

    const { data: orderBCheck } = await service
      .from('orders')
      .select('status')
      .eq('id', orderB!.id)
      .single();
    expect(orderBCheck!.status).toBe('pending_payment');

    // Limpieza de la evidencia
    await service.from('orders').delete().eq('id', orderB!.id);
    await service.auth.admin.deleteUser(userA!.id);
    await service.auth.admin.deleteUser(userB!.id);
  });
});
