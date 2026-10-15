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

/**
 * En dev, Turbopack compila la ruta bajo demanda y los estilos llegan en
 * stream; además la entrada de página anima opacidad 0→1 en 420 ms
 * (PageFade). Medir contraste en medio de cualquiera de las dos da
 * falsos positivos. Se espera a que el CSS esté aplicado (botón primario
 * con la tinta del token) y a que la cadena de opacidad del titular sea
 * completamente opaca.
 */
async function stylesSettled(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('.btn-primary');
      if (!btn) return false;
      if (getComputedStyle(btn).backgroundColor !== 'rgb(28, 23, 18)') return false;
      let el = document.querySelector('main h1');
      while (el && el instanceof HTMLElement) {
        if (getComputedStyle(el).opacity !== '1') return false;
        el = el.parentElement;
      }
      return true;
    },
    undefined,
    { timeout: 20_000 }
  );
}

test.describe('Accesibilidad axe', () => {
  test('home: sin violaciones críticas ni serias', async ({ page }) => {
    await page.goto('/');
    await stylesSettled(page);
    const results = await new AxeBuilder({ page }).analyze();
    const bad = serious(results.violations);
    expect(
      bad.map((v) => `${v.id} (${v.help}): ${v.nodes.length} nodos`),
      JSON.stringify(bad.map((v) => v.nodes.map((n) => n.target)), null, 2)
    ).toEqual([]);
  });

  test('ficha: sin violaciones críticas ni serias', async ({ page }) => {
    await page.goto('/producto/sofa-norte-220');
    await stylesSettled(page);
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
    // El formulario debe estar renderizado Y con los estilos aplicados.
    const submit = page.getByRole('button', { name: 'Crear pedido y transferir' });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();
    await stylesSettled(page);

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
