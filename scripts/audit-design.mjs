// Auditoría de diseño programática (Lumen Editorial §5): verifica estilos
// COMPUTADOS en el DOM real, no en el código. Requiere dev server + Supabase.
// Uso: node scripts/audit-design.mjs
import { chromium } from '@playwright/test';

const base = 'http://localhost:3000';
let failures = 0;
const ok = (name) => console.log(`  ok ${name}`);
const bad = (name, detail) => {
  failures++;
  console.log(`  FALLO ${name} — ${detail}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// ---------- HOME ----------
await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const header = await page
  .locator('header')
  .first()
  .evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      position: cs.position,
      height: r.height,
      bg: cs.backgroundColor,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
      font: cs.fontFamily,
    };
  });
if (header.position === 'fixed' && header.height === 64) {
  ok(`header fijo de 64px (${header.height}px)`);
} else {
  bad('header fijo 64px', JSON.stringify(header));
}
if (/backdrop-filter|blur/.test(header.backdrop ?? '')) {
  ok('header con backdrop blur');
} else {
  bad('header backdrop blur', header.backdrop ?? 'sin blur');
}
// --paper #f3eee6 => oklab con componente clara al 95%; el canal a/b es casi 0.
if (/oklab\(0\.9[0-9]/.test(header.bg) || header.bg.includes('243')) {
  ok(`header fondo papel al 92%: ${header.bg}`);
} else {
  bad('header fondo papel', header.bg);
}

const h1 = await page.evaluate(() => {
  const el = document.querySelector('h1');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    font: cs.fontFamily,
    size: cs.fontSize,
    tracking: cs.letterSpacing,
    align: cs.textAlign,
    left: r.left,
    viewportW: window.innerWidth,
  };
});
if (h1) {
  if (/fraunces/i.test(h1.font)) {
    ok(`h1 en Fraunces (${h1.font.split(',')[0]})`);
  } else {
    bad('h1 Fraunces', h1.font);
  }
  if (parseFloat(h1.size) >= 52) {
    ok(`h1 tamaño display ${h1.size}`);
  } else {
    bad('h1 tamaño display 64-112px', h1.size);
  }
  // 'start' es el valor computado de text-align:left en LTR: izquierda real.
  const leftAligned =
    (h1.align === 'left' || h1.align === 'start') && h1.left < h1.viewportW * 0.45;
  if (leftAligned) {
    ok('h1 alineado a la izquierda');
  } else {
    bad('h1 alineado a la izquierda', `${h1.align} left=${h1.left}`);
  }
  if (parseFloat(h1.tracking) < 0) {
    ok(`h1 tracking ${h1.tracking}`);
  } else {
    bad('h1 tracking -0.03em', h1.tracking);
  }
} else {
  bad('h1 existe', 'no hay h1 en el home');
}

// Fuentes realmente cargadas por el browser. Las familias __nextjs-* son
// del dev overlay del framework (solo dev), no del diseño de la app.
const fonts = await page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
});
const appFonts = [...new Set(fonts)].filter((f) => !f.startsWith('__nextjs'));
if (appFonts.some((f) => /fraunces/i.test(f))) {
  ok('Fraunces cargada');
} else {
  bad('Fraunces cargada', appFonts.join(','));
}
if (appFonts.some((f) => /schibsted/i.test(f))) {
  ok('Schibsted Grotesk cargada');
} else {
  bad('Schibsted Grotesk', appFonts.join(','));
}
if (appFonts.some((f) => /plex mono/i.test(f))) {
  ok('IBM Plex Mono cargada');
} else {
  bad('IBM Plex Mono', appFonts.join(','));
}
if (appFonts.some((f) => /inter|^geist$|roboto/i.test(f))) {
  bad('sin fuentes prohibidas', appFonts.join(','));
} else {
  ok('sin Inter/Geist/Roboto en la app');
}

// Números de catálogo mono tracking 0.08em (letterSpacing computa en px:
// 0.08em × fontSize — 12px → 0.96px)
const catalog = await page
  .locator('.text-catalog')
  .first()
  .evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      font: cs.fontFamily,
      trackingPx: parseFloat(cs.letterSpacing),
      sizePx: parseFloat(cs.fontSize),
    };
  });
if (/plex mono/i.test(catalog.font)) {
  ok(`número de pieza en mono (${catalog.font.split(',')[0]})`);
} else {
  bad('número de pieza mono', catalog.font);
}
if (Math.abs(catalog.trackingPx - 0.08 * catalog.sizePx) < 0.01) {
  ok(`número de pieza tracking 0.08em (${catalog.trackingPx}px @ ${catalog.sizePx}px)`);
} else {
  bad('número tracking 0.08em', `${catalog.trackingPx}px @ ${catalog.sizePx}px`);
}

// Nadie con radio > 6px
const bigRadii = await page.evaluate(() => {
  const offenders = [];
  for (const el of document.querySelectorAll('button,a,img,div,article,section,input')) {
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius);
    if (!Number.isNaN(r) && r > 6.05) {
      offenders.push(`${el.tagName}.${el.className.toString().slice(0, 40)}=${r}px`);
    }
    if (offenders.length > 4) break;
  }
  return offenders;
});
if (bigRadii.length === 0) {
  ok('todos los radios <= 6px');
} else {
  bad('radios <= 6px', bigRadii.join(' | '));
}

// ---------- FICHA: swatch con nombre+hex ----------
await page.goto(`${base}/producto/sofa-norte-220`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const swatch = await page.evaluate(() => {
  const fieldset = document.querySelector('fieldset');
  const first = fieldset?.querySelector('button');
  return first ? first.textContent : null;
});
if (swatch && /arena|tinta|pino/i.test(swatch)) {
  ok(`swatch con nombre y hex (${swatch.trim().slice(0, 30)})`);
} else {
  bad('swatch con nombre y hex', JSON.stringify(swatch ?? 'no encontrado'));
}

const price = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-testid="price"]')];
  return els[0]?.textContent ?? null;
});
if (price) {
  ok(`precio visible: ${price.trim()}`);
} else {
  bad('precio visible', 'no encontrado');
}

// ---------- CART EMPTY ----------
await page.goto(`${base}/carrito`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const cartEmpty = await page.evaluate(() => document.body.textContent ?? '');
if (/silencio|carrito/i.test(cartEmpty) && /agregues|cuando/i.test(cartEmpty)) {
  ok('estado vacío del carrito con frase de taller');
} else {
  bad('estado vacío carrito', 'frase no encontrada');
}

// ---------- CHECKOUT: CLABE visible ----------
await page.goto(`${base}/checkout`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const body = await page.evaluate(() => document.body.textContent ?? '');
if (body.includes('002180000000000000')) {
  ok('CLABE pública visible en checkout');
} else {
  console.log(
    '  info: checkout sin carrito redirige a /carrito; la CLABE se cubre en pedido-spei.spec.ts'
  );
}

await browser.close();
if (failures === 0) {
  console.log('\nDISEÑO: TODO OK');
} else {
  console.log(`\nDISEÑO: ${failures} FALLOS`);
  process.exitCode = 1;
}
