/**
 * Medición de LCP y CLS con el build de producción (skill
 * auditoria-seguridad, punto 7). Uso:
 *
 *   npm run build && npm run start -- -p 3100
 *   node scripts/measure-cwv.mjs http://localhost:3100
 *
 * Presupuesto: LCP < 2.5 s y CLS < 0.1 en home y en una ficha.
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const pages = ['/', '/producto/sofa-norte-220'];

const browser = await chromium.launch();
let failed = false;

for (const path of pages) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: 'load' });

  const { lcp, cls } = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let lcpValue = 0;
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcpValue = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) clsValue += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve({ lcp: lcpValue, cls: clsValue }), 3000);
      })
  );

  const okLcp = lcp < 2500;
  const okCls = cls < 0.1;
  if (!okLcp || !okCls) failed = true;

  console.log(
    `${okLcp ? '✓' : '✗'} ${path} — LCP ${(lcp / 1000).toFixed(2)} s (meta < 2.5 s) · ${okCls ? '✓' : '✗'} CLS ${cls.toFixed(3)} (meta < 0.1)`
  );
  await context.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
