/**
 * Generador de piezas SVG del seed — Casa Lumen / NOMAHOME.
 *
 * Cada variante del catálogo semilla tiene su propio SVG: composición
 * geométrica distinta por tipo de pieza, paleta del sistema Lumen Editorial,
 * número de catálogo visible. Sin fotos de stock: piezas dibujadas por el
 * taller.
 *
 * Ejecutar:  node scripts/generate-seed-svg.mjs
 * Salida:    public/brand/seed/<sku-slug>-<color>.svg
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/brand/seed');

// Paleta del sistema (app/styles/tokens.css)
const C = {
  ink: '#1c1712',
  inkSoft: '#4a433c',
  paper: '#f3eee6',
  paper2: '#e7e0d4',
  stone: '#d8cfc2',
  brass: '#8d6840',
  brass2: '#c4a27a',
  clay: '#9c4630',
  pine: '#243f34',
  line: 'rgba(28, 23, 18, 0.14)',
};

// Colores de catálogo
const COLORS = {
  arena: { name: 'Arena', hex: '#d8cfc2' },
  tinta: { name: 'Tinta', hex: '#1c1712' },
  pino: { name: 'Pino', hex: '#243f34' },
  roble: { name: 'Roble', hex: '#a98d6b' },
  nogal: { name: 'Nogal', hex: '#5b4432' },
  grafito: { name: 'Grafito', hex: '#3a3733' },
  haya: { name: 'Haya', hex: '#c9a887' },
  arcilla: { name: 'Arcilla', hex: '#9c4630' },
  hueso: { name: 'Hueso', hex: '#ede6d8' },
  laton: { name: 'Latón', hex: '#c4a27a' },
};

const S = (w = 3) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// ---------------------------------------------------------------------------
// Composiciones: una por tipo de pieza. f = color de la variante.
// ---------------------------------------------------------------------------

const sofa = (f) => `
  <line x1="120" y1="720" x2="680" y2="720" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="150" y="290" width="500" height="150" rx="10" fill="${f}" ${S(3)}/>
  <line x1="400" y1="305" x2="400" y2="425" stroke="${C.ink}" stroke-width="2" opacity="0.5"/>
  <rect x="128" y="430" width="544" height="120" rx="12" fill="${f}" ${S(3)}/>
  <line x1="272" y1="440" x2="272" y2="540" stroke="${C.ink}" stroke-width="2" opacity="0.5"/>
  <line x1="528" y1="440" x2="528" y2="540" stroke="${C.ink}" stroke-width="2" opacity="0.5"/>
  <rect x="106" y="372" width="64" height="208" rx="8" fill="${f}" ${S(3)}/>
  <rect x="630" y="372" width="64" height="208" rx="8" fill="${f}" ${S(3)}/>
  <path d="M170 580 L158 720" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M630 580 L642 720" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M226 580 L218 720" stroke="${C.ink}" stroke-width="5" fill="none" opacity="0.7"/>
  <path d="M574 580 L582 720" stroke="${C.ink}" stroke-width="5" fill="none" opacity="0.7"/>
  <path d="M470 200 q28 24 0 48" fill="none" stroke="${C.brass2}" stroke-width="3"/>
  <circle cx="470" cy="188" r="5" fill="${C.brass}"/>
  <path d="M300 236 h90 M410 236 h90" stroke="${C.brass2}" stroke-width="3" opacity="0.8"/>`;

const table = (f) => `
  <line x1="100" y1="740" x2="700" y2="740" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="140" y="450" width="520" height="22" rx="4" fill="${f}" ${S(3)}/>
  <rect x="140" y="472" width="520" height="10" fill="${C.ink}" opacity="0.14"/>
  <path d="M220 472 L200 740" stroke="${C.ink}" stroke-width="9" fill="none"/>
  <path d="M580 472 L600 740" stroke="${C.ink}" stroke-width="9" fill="none"/>
  <path d="M240 472 L232 700 M560 472 L568 700" stroke="${C.ink}" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M205 700 h40 M555 700 h40" stroke="${C.ink}" stroke-width="4"/>
  <circle cx="520" cy="418" r="20" fill="none" stroke="${C.brass}" stroke-width="4"/>
  <path d="M520 398 q14 -18 0 -34" fill="none" stroke="${C.brass}" stroke-width="4"/>
  <rect x="286" y="414" width="120" height="8" rx="2" fill="${C.brass2}"/>
  <rect x="298" y="406" width="96" height="8" rx="2" fill="${C.brass}"/>`;

const chair = (f) => `
  <line x1="140" y1="760" x2="660" y2="760" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="330" y="240" width="140" height="300" fill="none" ${S(4)}/>
  <line x1="365" y1="244" x2="365" y2="536" stroke="${C.ink}" stroke-width="3"/>
  <line x1="400" y1="244" x2="400" y2="536" stroke="${C.ink}" stroke-width="3"/>
  <line x1="435" y1="244" x2="435" y2="536" stroke="${C.ink}" stroke-width="3"/>
  <rect x="330" y="240" width="140" height="40" fill="${f}" opacity="0.9"/>
  <rect x="296" y="540" width="208" height="26" rx="4" fill="${f}" ${S(3)}/>
  <path d="M310 566 L280 760" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M490 566 L520 760" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M330 566 L320 700" stroke="${C.ink}" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M470 566 L480 700" stroke="${C.ink}" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M292 690 h228" stroke="${C.ink}" stroke-width="4"/>
  <path d="M400 540 v-260" stroke="${C.ink}" stroke-width="2" opacity="0.35"/>`;

const nightstand = (f) => `
  <line x1="160" y1="740" x2="640" y2="740" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="280" y="360" width="240" height="270" fill="${f}" ${S(3)}/>
  <rect x="300" y="382" width="200" height="100" fill="none" ${S(2)}/>
  <circle cx="400" cy="432" r="9" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/>
  <rect x="300" y="506" width="200" height="100" fill="none" ${S(2)}/>
  <circle cx="400" cy="556" r="9" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M300 630 L282 740" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M500 630 L518 740" stroke="${C.ink}" stroke-width="7" fill="none"/>
  <path d="M320 630 L312 740" stroke="${C.ink}" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M480 630 L488 740" stroke="${C.ink}" stroke-width="4" fill="none" opacity="0.6"/>
  <rect x="296" y="330" width="60" height="14" rx="2" fill="${C.pine}"/>
  <rect x="304" y="316" width="46" height="14" rx="2" fill="${C.brass2}"/>
  <circle cx="500" cy="322" r="12" fill="none" stroke="${C.brass}" stroke-width="3"/>`;

const shelf = (f) => `
  <line x1="130" y1="830" x2="670" y2="830" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="212" y="230" width="14" height="600" fill="${C.ink}"/>
  <rect x="574" y="230" width="14" height="600" fill="${C.ink}"/>
  <rect x="226" y="350" width="348" height="16" fill="${f}" ${S(2)}/>
  <rect x="226" y="490" width="348" height="16" fill="${f}" ${S(2)}/>
  <rect x="226" y="630" width="348" height="16" fill="${f}" ${S(2)}/>
  <rect x="226" y="770" width="348" height="16" fill="${f}" ${S(2)}/>
  <circle cx="300" cy="318" r="26" fill="none" stroke="${C.brass}" stroke-width="4"/>
  <path d="M300 292 q16 -22 0 -40" fill="none" stroke="${C.brass}" stroke-width="4"/>
  <rect x="360" y="308" width="14" height="42" fill="${C.pine}"/>
  <rect x="378" y="318" width="12" height="32" fill="${C.clay}"/>
  <rect x="394" y="300" width="16" height="50" fill="${C.stone}"/>
  <rect x="470" y="448" width="90" height="14" rx="3" fill="${C.brass2}"/>
  <rect x="482" y="434" width="66" height="14" rx="3" fill="${C.brass}"/>
  <rect x="492" y="420" width="46" height="14" rx="3" fill="${C.pine}"/>
  <circle cx="300" cy="590" r="22" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <path d="M300 568 v-60 M300 540 q-22 12 -30 -6 M300 540 q22 12 30 -6" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <rect x="440" y="722" width="110" height="34" rx="4" fill="${C.stone}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M460 722 v-18 h36 v18" fill="none" stroke="${C.ink}" stroke-width="3"/>`;

const tablelamp = (f) => `
  <line x1="180" y1="700" x2="620" y2="700" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <path d="M300 290 L500 290 L458 402 L342 402 Z" fill="${f}" ${S(3)}/>
  <line x1="330" y1="316" x2="470" y2="316" stroke="${C.ink}" stroke-width="1.5" opacity="0.4"/>
  <line x1="338" y1="342" x2="462" y2="342" stroke="${C.ink}" stroke-width="1.5" opacity="0.4"/>
  <line x1="346" y1="368" x2="454" y2="368" stroke="${C.ink}" stroke-width="1.5" opacity="0.4"/>
  <rect x="394" y="402" width="12" height="196" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/>
  <ellipse cx="400" cy="620" rx="86" ry="20" fill="${C.brass}" stroke="${C.ink}" stroke-width="3"/>
  <path d="M270 244 q130 -60 260 0" fill="none" stroke="${C.brass2}" stroke-width="3"/>
  <path d="M310 214 q90 -40 180 0" fill="none" stroke="${C.brass2}" stroke-width="2" opacity="0.6"/>
  <circle cx="400" cy="620" r="7" fill="${C.ink}"/>`;

const floorlamp = (f) => `
  <line x1="160" y1="780" x2="640" y2="780" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <path d="M330 760 L330 330 Q330 260 420 260 L560 260" fill="none" stroke="${C.brass}" stroke-width="10"/>
  <path d="M310 780 L350 780 L340 760 L320 760 Z" fill="${C.ink}"/>
  <ellipse cx="330" cy="760" rx="70" ry="16" fill="${C.ink}"/>
  <path d="M508 260 L612 260 L596 350 L524 350 Z" fill="${f}" ${S(3)}/>
  <line x1="560" y1="260" x2="560" y2="350" stroke="${C.ink}" stroke-width="2"/>
  <circle cx="560" cy="404" r="10" fill="${C.brass2}"/>
  <path d="M560 350 L560 394" stroke="${C.ink}" stroke-width="2"/>
  <path d="M470 420 q90 14 180 0" fill="none" stroke="${C.brass2}" stroke-width="2.5" opacity="0.8"/>
  <path d="M490 448 q70 10 140 0" fill="none" stroke="${C.brass2}" stroke-width="2" opacity="0.5"/>`;

const soundbar = (f) => `
  <line x1="120" y1="760" x2="680" y2="760" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="170" y="600" width="460" height="130" fill="none" ${S(3)}/>
  <path d="M200 730 L192 760 M600 730 L608 760" stroke="${C.ink}" stroke-width="6" fill="none"/>
  <line x1="170" y1="640" x2="630" y2="640" stroke="${C.ink}" stroke-width="1.5" opacity="0.4"/>
  <rect x="120" y="512" width="560" height="72" rx="36" fill="${f}" ${S(3)}/>
  <g opacity="0.45" stroke="${C.paper}" stroke-width="3">
    ${Array.from({ length: 14 }, (_, i) => `<circle cx="${172 + i * 36}" cy="548" r="4" fill="none"/>`).join('')}
  </g>
  <circle cx="632" cy="548" r="6" fill="${C.brass2}"/>
  <path d="M330 470 q70 -26 140 0" fill="none" stroke="${C.brass2}" stroke-width="3"/>
  <path d="M356 440 q44 -16 88 0" fill="none" stroke="${C.brass2}" stroke-width="2" opacity="0.6"/>`;

const speaker = (f) => `
  <line x1="220" y1="800" x2="580" y2="800" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="310" y="290" width="180" height="440" rx="14" fill="${f}" ${S(3)}/>
  <circle cx="400" cy="420" r="62" fill="none" stroke="${C.ink}" stroke-width="4"/>
  <circle cx="400" cy="420" r="24" fill="${C.brass2}" stroke="${C.ink}" stroke-width="3"/>
  <circle cx="400" cy="560" r="40" fill="none" stroke="${C.ink}" stroke-width="3.5"/>
  <circle cx="400" cy="560" r="14" fill="${C.brass}" stroke="${C.ink}" stroke-width="2"/>
  <rect x="366" y="672" width="68" height="10" rx="5" fill="${C.ink}" opacity="0.35"/>
  <path d="M330 730 L318 800 M470 730 L482 800" stroke="${C.ink}" stroke-width="6" fill="none"/>
  <path d="M290 250 q110 -40 220 0" fill="none" stroke="${C.brass2}" stroke-width="2.5" opacity="0.8"/>`;

const router = (f) => `
  <line x1="200" y1="700" x2="600" y2="700" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="280" y="480" width="240" height="130" rx="12" fill="${f}" ${S(3)}/>
  <g stroke="${C.ink}" stroke-width="1.5" opacity="0.3" fill="none">
    <path d="M296 520 q60 -8 208 4"/>
    <path d="M296 548 q80 -10 208 4"/>
    <path d="M296 576 q50 -6 208 3"/>
  </g>
  <line x1="480" y1="480" x2="480" y2="330" stroke="${C.ink}" stroke-width="5"/>
  <circle cx="480" cy="322" r="9" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <circle cx="326" cy="545" r="6" fill="${C.brass2}"/>
  <circle cx="352" cy="545" r="6" fill="${C.brass2}" opacity="0.6"/>
  <path d="M330 300 q80 -30 160 0" fill="none" stroke="${C.brass2}" stroke-width="3"/>
  <path d="M356 272 q54 -20 108 0" fill="none" stroke="${C.brass2}" stroke-width="2" opacity="0.55"/>
  <rect x="336" y="610" width="128" height="8" rx="4" fill="${C.ink}" opacity="0.3"/>`;

const purifier = (f) => `
  <line x1="220" y1="800" x2="580" y2="800" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <rect x="320" y="330" width="160" height="400" rx="32" fill="${f}" ${S(3)}/>
  <g stroke="${C.ink}" stroke-width="3" opacity="0.55">
    <line x1="352" y1="378" x2="448" y2="378"/>
    <line x1="344" y1="398" x2="456" y2="398"/>
    <line x1="352" y1="418" x2="448" y2="418"/>
  </g>
  <circle cx="400" cy="560" r="16" fill="none" stroke="${C.brass}" stroke-width="3"/>
  <path d="M400 560 v-36" stroke="${C.brass}" stroke-width="3"/>
  <path d="M500 360 q60 -10 96 24" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.5"/>
  <path d="M504 420 q80 -8 132 30" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.35"/>
  <path d="M506 480 q100 -4 168 36" fill="none" stroke="${C.ink}" stroke-width="3" opacity="0.2"/>
  <path d="M340 730 L332 800 M460 730 L468 800" stroke="${C.ink}" stroke-width="5" fill="none"/>
  <path d="M290 290 q110 -36 220 0" fill="none" stroke="${C.brass2}" stroke-width="2.5" opacity="0.8"/>`;

const hub = (f) => `
  <g stroke="${C.ink}" stroke-width="2.5" opacity="0.35" fill="none">
    <path d="M540 240 q10 130 -4 560"/>
    <path d="M580 250 q14 120 0 540"/>
    <path d="M620 260 q18 110 4 520"/>
    <path d="M660 270 q10 100 -8 490"/>
  </g>
  <line x1="150" y1="700" x2="500" y2="700" stroke="${C.ink}" stroke-width="2" opacity="0.55"/>
  <path d="M296 620 q104 -44 208 0 L488 676 q-88 26 -184 0 Z" fill="${f}" ${S(3)}/>
  <ellipse cx="400" cy="676" rx="92" ry="22" fill="${f}" ${S(3)}/>
  <circle cx="358" cy="650" r="5" fill="${C.brass2}"/>
  <path d="M330 560 q70 -54 140 0" fill="none" stroke="${C.brass}" stroke-width="3"/>
  <path d="M352 530 q48 -38 96 0" fill="none" stroke="${C.brass}" stroke-width="3"/>
  <path d="M374 500 q26 -20 52 0" fill="none" stroke="${C.brass}" stroke-width="3"/>
  <circle cx="400" cy="486" r="6" fill="${C.brass}"/>`;

const COMPOSITIONS = {
  sofa, table, chair, nightstand, shelf, tablelamp, floorlamp, soundbar, speaker, router, purifier, hub,
};

// ---------------------------------------------------------------------------
// Catálogo de piezas del seed
// ---------------------------------------------------------------------------

const PRODUCTS = [
  { sku: 'CL-SOF-220', slug: 'sofa-norte-220', name: 'Sofá Norte 220', comp: 'sofa', colors: ['arena', 'tinta', 'pino'] },
  { sku: 'CL-MES-140', slug: 'mesa-de-roble-lerma', name: 'Mesa de roble Lerma', comp: 'table', colors: ['roble', 'nogal', 'grafito'] },
  { sku: 'CL-SIL-090', slug: 'silla-de-comedor-quiroga', name: 'Silla de comedor Quiroga', comp: 'chair', colors: ['haya', 'tinta', 'arcilla'] },
  { sku: 'CL-BUR-070', slug: 'buro-de-noche-tzintzuntzan', name: 'Buró de noche Tzintzuntzan', comp: 'nightstand', colors: ['roble'] },
  { sku: 'CL-EST-180', slug: 'estante-de-acero-morelia', name: 'Estante de acero Morelia', comp: 'shelf', colors: ['grafito', 'hueso', 'pino'] },
  { sku: 'CL-LMT-045', slug: 'lampara-de-mesa-patzcuaro', name: 'Lámpara de mesa Pátzcuaro', comp: 'tablelamp', colors: ['laton', 'tinta', 'hueso'] },
  { sku: 'CL-LMP-052', slug: 'lampara-de-pie-mil-cumbres', name: 'Lámpara de pie Mil Cumbres', comp: 'floorlamp', colors: ['laton'] },
  { sku: 'CL-BDS-310', slug: 'barra-de-sonido-para-mueble-bajo', name: 'Barra de sonido para mueble bajo', comp: 'soundbar', colors: ['grafito'] },
  { sku: 'CL-BOC-205', slug: 'bocina-de-estanteria-cuitzeo', name: 'Bocina de estantería Cuitzeo', comp: 'speaker', colors: ['hueso', 'tinta', 'arcilla'] },
  { sku: 'CL-ROU-110', slug: 'router-de-hogar-en-caja-de-roble', name: 'Router de hogar en caja de roble', comp: 'router', colors: ['roble'] },
  { sku: 'CL-PUR-330', slug: 'purificador-de-aire-para-sala', name: 'Purificador de aire para sala', comp: 'purifier', colors: ['hueso'] },
  { sku: 'CL-HUB-120', slug: 'hub-de-cortinas-motorizadas', name: 'Hub de cortinas motorizadas', comp: 'hub', colors: ['grafito'] },
];

// Fondo alterno para variedad editorial
const BACKGROUNDS = [C.paper, C.paper2, C.stone];

function svgFor(product, colorSlug, index) {
  const color = COLORS[colorSlug];
  const bg = BACKGROUNDS[index % BACKGROUNDS.length];
  const comp = COMPOSITIONS[product.comp](color.hex);
  const upperSku = product.sku;
  const upperName = product.name.toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${upperSku} ${product.name}, color ${color.name}">
  <!-- Pieza de catálogo NOMAHOME — dibujo del taller, no fotografía -->
  <rect width="800" height="1000" fill="${bg}"/>

  <g stroke="${C.ink}" stroke-width="1.5" opacity="0.65">
    <path d="M26 56 v-30 h30"/>
    <path d="M774 56 v-30 h-30"/>
    <path d="M26 944 v30 h30"/>
    <path d="M774 944 v30 h-30"/>
  </g>
  <rect x="44" y="44" width="712" height="912" fill="none" stroke="${C.line}"/>

  <text x="64" y="96" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="19" letter-spacing="4" fill="${C.inkSoft}">NOMAHOME · MORELIA</text>
  <text x="736" y="96" text-anchor="end" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="19" letter-spacing="4" fill="${C.inkSoft}">PIEZA DE CATÁLOGO</text>

  <g transform="translate(0, -20)">
    ${comp}
  </g>

  <line x1="64" y1="884" x2="736" y2="884" stroke="${C.line}" stroke-width="2"/>
  <text x="64" y="920" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="28" font-weight="600" letter-spacing="6" fill="${C.ink}">${upperSku}</text>
  <text x="64" y="944" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="17" letter-spacing="2" fill="${C.inkSoft}">${upperName}</text>

  <rect x="596" y="926" width="22" height="22" rx="2" fill="${color.hex}" stroke="${C.ink}" stroke-width="1.5"/>
  <text x="630" y="944" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="17" letter-spacing="2" fill="${C.inkSoft}">${color.name.toUpperCase()}</text>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const [pi, product] of PRODUCTS.entries()) {
  for (const [ci, colorSlug] of product.colors.entries()) {
    const file = `${product.slug}-${colorSlug}.svg`;
    writeFileSync(resolve(OUT_DIR, file), svgFor(product, colorSlug, pi + ci));
    count += 1;
    console.log(`✓ ${file}`);
  }
}

console.log(`\n${count} piezas SVG escritas en public/brand/seed/`);
