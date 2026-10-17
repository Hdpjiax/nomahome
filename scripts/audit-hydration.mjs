// Verificación de hidratación con prefers-reduced-motion (fase 9):
// el bug original: PageFade renderizaba elementos distintos por rama y
// los useId internos (pestañas de la ficha) se corrían entre servidor y
// cliente. Corre contra el build de producción en http://localhost:3100.
// Uso: npm run build && npx next start -p 3100 && node scripts/audit-hydration.mjs
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:3100';
let failures = 0;

const browser = await chromium.launch();

for (const reduced of ['reduce', 'no-preference']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduced,
  });
  const page = await context.newPage();
  const hydrationErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && /hydrat|did not match|didn't match/i.test(text)) {
      hydrationErrors.push(text.split('\n')[0]);
    }
  });
  page.on('pageerror', (err) => {
    if (/hydrat/i.test(err.message)) hydrationErrors.push(err.message.split('\n')[0]);
  });

  for (const path of ['/', '/producto/silla-de-comedor-quiroga']) {
    await page.goto(`${base}${path}`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
  }

  if (hydrationErrors.length === 0) {
    console.log(`  ok reducedMotion=${reduced}: sin errores de hidratación`);
  } else {
    failures++;
    console.log(`  FALLO reducedMotion=${reduced}:`);
    for (const e of hydrationErrors.slice(0, 3)) console.log(`    ${e}`);
  }
  await context.close();
}

await browser.close();
if (failures === 0) {
  console.log('\nHIDRATACIÓN: TODO OK');
} else {
  console.log(`\nHIDRATACIÓN: ${failures} FALLOS`);
  process.exitCode = 1;
}
