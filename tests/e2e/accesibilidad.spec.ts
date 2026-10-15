import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Fase 9 — axe en las tres pantallas críticas (§5, skill auditoría):
 * home, ficha y checkout. Cero violaciones críticas o serias.
 */
const CRITICAL = ['critical', 'serious'];

function serious(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.filter((v) => CRITICAL.includes(v.impact ?? ''));
}

test.describe('Accesibilidad axe', () => {
  test('home: sin violaciones críticas ni serias', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const bad = serious(results.violations);
    expect(
      bad.map((v) => `${v.id} (${v.help}): ${v.nodes.length} nodos`),
      JSON.stringify(bad.map((v) => v.nodes.map((n) => n.target)), null, 2)
    ).toEqual([]);
  });

  test('ficha: sin violaciones críticas ni serias', async ({ page }) => {
    await page.goto('/producto/sofa-norte-220');
    const results = await new AxeBuilder({ page }).analyze();
    const bad = serious(results.violations);
    expect(
      bad.map((v) => `${v.id} (${v.help}): ${v.nodes.length} nodos`),
      JSON.stringify(bad.map((v) => v.nodes.map((n) => n.target)), null, 2)
    ).toEqual([]);
  });

  test('checkout: sin violaciones críticas ni serias', async ({ page }) => {
    // El checkout exige carrito: se llena desde la ficha.
    await page.goto('/producto/mesa-de-roble-lerma');
    await page.getByRole('button', { name: /Agregar al carrito/ }).first().click();
    await expect(page.getByText('En el carrito')).toBeVisible();
    await page.goto('/checkout');
    // En dev, Turbopack compila la ruta bajo demanda: se espera a que el
    // formulario esté realmente renderizado antes de medir contraste.
    const submit = page.getByRole('button', { name: 'Crear pedido y transferir' });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();

    const results = await new AxeBuilder({ page }).analyze();
    const bad = serious(results.violations);
    expect(
      bad.map((v) => `${v.id} (${v.help}): ${v.nodes.length} nodos`),
      JSON.stringify(bad.map((v) => v.nodes.map((n) => n.target)), null, 2)
    ).toEqual([]);
  });

  test('con reduced motion la ficha no crashea y sigue usable', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto('/producto/silla-de-comedor-quiroga');
    await expect(page.getByRole('heading', { name: 'Silla de comedor Quiroga' })).toBeVisible();
    await page.getByRole('button', { name: /Tinta/ }).first().click();
    await expect(page.getByTestId('price').first()).toBeVisible();
    await context.close();
  });
});
