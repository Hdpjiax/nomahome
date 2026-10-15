/**
 * Generador de la imagen Open Graph — NOMAHOME.
 *
 * Rasteriza un SVG editorial del repo (misma paleta que el sistema) a
 * public/og.png con @resvg/resvg-js. Se corre una vez y el PNG se commitea:
 * la imagen OG no depende del runtime (el /og con next/og se colgaba en
 * Windows/Turbopack; un PNG estático no se cuelga nunca).
 *
 * Uso: node scripts/generate-og.mjs   (o npm run og:png)
 */

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const C = {
  ink: '#1c1712',
  inkSoft: '#4a433c',
  paper: '#f3eee6',
  line: 'rgba(28,23,18,0.2)',
  brass: '#8d6840',
};

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${C.paper}"/>

  <g stroke="${C.ink}" stroke-width="2" opacity="0.6">
    <path d="M28 66 v-24 h24"/>
    <path d="M1172 66 v-24 h-24"/>
    <path d="M28 564 v24 h24"/>
    <path d="M1172 564 v24 h-24"/>
  </g>

  <text x="84" y="72" font-family="monospace" font-size="19" letter-spacing="6" fill="${C.inkSoft}">NOMAHOME · MORELIA</text>
  <text x="1116" y="72" text-anchor="end" font-family="monospace" font-size="19" letter-spacing="6" fill="${C.inkSoft}">PIEZA DE CATÁLOGO</text>

  <rect x="84" y="300" width="120" height="6" fill="${C.brass}"/>

  <g font-family="Georgia, 'Times New Roman', serif" fill="${C.ink}">
    <text x="84" y="400" font-size="76" letter-spacing="-2">Muebles y tecnología</text>
    <text x="84" y="480" font-size="76" letter-spacing="-2">para vivir la casa.</text>
  </g>

  <line x1="84" y1="540" x2="1116" y2="540" stroke="${C.line}" stroke-width="2"/>

  <text x="84" y="576" font-family="monospace" font-size="20" fill="${C.inkSoft}">nomahome.us</text>
  <text x="1116" y="576" text-anchor="end" font-family="monospace" font-size="20" fill="${C.inkSoft}">IVA incluido · Taller desde 2019</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    // Fuentes de sistema: la imagen OG no necesita descargar nada.
    loadSystemFonts: true,
    defaultFontFamily: 'monospace',
  },
});

const png = resvg.render().asPng();
writeFileSync(resolve(ROOT, 'public/og.png'), png);
console.log(`✓ public/og.png (${(png.length / 1024).toFixed(1)} KB)`);
