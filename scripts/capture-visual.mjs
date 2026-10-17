// Captura visual de las pantallas críticas (auditoría de diseño §5).
// Requiere el dev server en localhost:3000 y el stack local de Supabase.
// Uso: node scripts/capture-visual.mjs [outDir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// test-results/ ya está en .gitignore.
const out = process.argv[2] ?? 'test-results/visual';
mkdirSync(out, { recursive: true });

const shots = [
  { name: 'home', url: 'http://localhost:3000/', fullPage: true },
  { name: 'design-system', url: 'http://localhost:3000/design-system', fullPage: true },
  { name: 'categoria-muebles', url: 'http://localhost:3000/categoria/muebles', fullPage: true },
  { name: 'ficha-sofa', url: 'http://localhost:3000/producto/sofa-norte-220', fullPage: true },
  { name: 'carrito', url: 'http://localhost:3000/carrito', fullPage: true },
  { name: 'checkout', url: 'http://localhost:3000/checkout', fullPage: true },
  { name: 'resenas', url: 'http://localhost:3000/resenas', fullPage: true },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const s of shots) {
  try {
    // domcontentloaded + asentado: el websocket HMR del dev server nunca
    // deja la red en networkidle.
    await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/${s.name}.png`, fullPage: s.fullPage });
    console.log(`ok ${s.name}`);
  } catch (e) {
    console.log(`FALLO ${s.name}: ${e.message.split('\n')[0]}`);
  }
}
await browser.close();
