import { test, expect } from '@playwright/test';

/**
 * Fase 4 — cuenta: alta con contraseña, perfil, direcciones, favoritos
 * y cierre de sesión. Corre contra el stack local (confirmación de correo
 * desactivada en dev).
 */
test.describe('Cuenta', () => {
  const email = `prueba+${Date.now()}@taller.mx`;
  const password = 'lumen2026';

  test('crear cuenta, guardar dirección y favorito, y cerrar sesión', async ({ page }) => {
    // /cuenta sin sesión muestra el panel de acceso
    await page.goto('/cuenta');
    await expect(page.getByText('Crear cuenta')).toBeVisible();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await page.getByLabel('Nombre').fill('Prueba del Taller');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();

    // El alta con sesión inmediata lleva al resumen
    await expect(page.getByRole('heading', { name: /Hola, Prueba/i })).toBeVisible();

    // Dirección
    await page.goto('/cuenta/direcciones');
    await page.getByLabel('¿A quién se entrega?').fill('Prueba del Taller');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Morelia');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('58000');
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(page.getByText('Dirección guardada.')).toBeVisible();

    // Favorito desde la ficha
    await page.goto('/producto/buro-de-noche-tzintzuntzan');
    await page.getByRole('button', { name: 'Guardar pieza' }).click();
    await expect(page.getByRole('button', { name: 'Guardada' })).toBeVisible();

    await page.goto('/cuenta/favoritos');
    await expect(page.getByText('Buró de noche Tzintzuntzan').first()).toBeVisible();

    // Pedidos vacíos con frase honesta
    await page.goto('/cuenta/pedidos');
    await expect(page.getByText('Todavía sin pedidos.')).toBeVisible();

    // Cerrar sesión
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL('/');
    await page.goto('/cuenta');
    await expect(page.getByText('Crear cuenta')).toBeVisible();
  });

  test('dirección inválida no pasa la validación del servidor', async ({ page }) => {
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Prueba DOS');
    await page.getByLabel('Correo').fill(`prueba2+${Date.now()}@taller.mx`);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola/i })).toBeVisible();

    await page.goto('/cuenta/direcciones');
    await page.getByLabel('¿A quién se entrega?').fill('Prueba DOS');
    await page.getByLabel('Calle y número').fill('Calle Taller 12');
    await page.getByLabel('Ciudad').fill('Morelia');
    await page.getByLabel('Estado').fill('Michoacán');
    await page.getByLabel('Código postal').fill('58'); // inválido
    await page.getByLabel('Teléfono').fill('4431234567');
    await page.getByRole('button', { name: 'Guardar dirección' }).click();
    await expect(
      page.getByText('El código postal mexicano lleva 5 dígitos.')
    ).toBeVisible();
  });

  test('entrar con contraseña tras crear la cuenta', async ({ page }) => {
    const mail = `relogin+${Date.now()}@taller.mx`;
    await page.goto('/cuenta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await page.getByLabel('Nombre').fill('Relogin Prueba');
    await page.getByLabel('Correo').fill(mail);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola/i })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL('/');

    await page.goto('/cuenta');
    await page.getByLabel('Correo').fill(mail);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
    await expect(page.getByRole('heading', { name: /Hola, Relogin/i })).toBeVisible();
  });
});
