# INSTRUCCIÓN ÚNICA — TIENDA CASA LUMEN / NOMAHOME (EDICIÓN DE LUJO)

Ejecuta este documento completo, de la fase 0 a la fase 10, sobre la rama `main`. No pidas confirmación entre fases. No entregues un resumen en lugar del código. No uses un template visual genérico. Si falta un secreto, deja la integración cableada, el cobro bloqueado con explicación y `.env.example` documentado; un pago aprobado solo se simula en `PAYMENTS_MODE=sandbox` y siempre a través del webhook firmado.

Sustituye solo estos valores si el humano los escribió encima. Si no, usa los defaults.

```yaml
marca: NOMAHOME
tagline: Muebles de autor, iluminación 2700K y tecnología para vivir la casa
ciudad: Morelia, Michoacán
pais: MX
moneda: MXN
iva: 0.16
idioma: es-MX
dominio: nomahome.us
whatsapp_e164: "5215539042880"
email_soporte: hola@nomahome.us
```

---

## 1. Misión y Experiencia de Lujo

Construir una casa de ebanistería arquitectónica, iluminación cálida y tecnología residencial de lujo en Morelia (`NOMAHOME`). Debe sentirse viva, editorial, táctil y propia — jamás como un theme genérico de Shopify, un dashboard shadcn ni una página vacía con inicios raros.

Desde el primer instante en que el comprador entra a `/`, la página muestra lo que busca:
- **Vitrina Inmediata Above-the-Fold (`HeroVitrina`)**: acceso directo a todas las colecciones (`Muebles`, `Iluminación`, `Tecnología del hogar`, `Textiles`), buscador inmediato, selector en vivo de las 4 piezas insignia con cambio de acabado/color en tiempo real, precio con IVA desglosado, medidas arquitectónicas y agregado rápido al carrito sin salir de la portada.
- **Catálogo Interactivo en Vivo (`InteractiveCatalogShowcase`)**: filtrado instantáneo con transiciones fluidas (`motion/react`), cambio de variante/acabado directamente desde cada tarjeta de producto (`PieceCard`), alternador entre fotografía real de alta resolución y ficha técnica de estudio, y panel `QuickAdd`.
- **Lookbook Interactivo ("Espacios NOMA · Shop the Room")**: escenas arquitectónicas de Sala y Comedor con puntos interactivos (`01`–`04`) que revelan cada pieza en contexto con su medida, material, stock y compra inmediata.
- **Respaldo Semilla Permanente (`lib/catalog/fallback-catalog.ts`)**: aún antes de conectar o sembrar Supabase, la tienda muestra las 12 piezas completas con sus 24 variantes, precios, fotografías y carrito funcional, sin pantallas vacías ni inicios raros.

Stack fijo: Next.js App Router, TypeScript strict, Tailwind con tokens propios, Supabase (Postgres, Auth, Storage, RLS), Vercel.

Cobro fijo: pasarela propia por transferencia SPEI entrante. El comprador ve la CLABE pública del taller y su referencia de pedido; nunca se capturan datos de tarjeta en este sitio. La dirección de facturación vive en el CFDI y el admin la ve en el ledger.

Factura fija: UI propia. Timbrado CFDI 4.0 con el paquete `facturapi`. Un PDF generado aquí no es factura.

---

## 2. Reglas duras

Prohibido, sin excepción:

- Marcar `orders.status = paid` desde el cliente, desde WhatsApp o sin webhook con firma válida.
- Poner `SUPABASE_SERVICE_ROLE_KEY` `NEXT_PUBLIC_`.
- Desactivar RLS, usar el service role en componentes cliente, o confiar en un rol guardado solo en `localStorage`.
- `any`, `@ts-ignore` y precios calculados solo en el navegador.
- Inter, Roboto, Geist, Arial, cards zinc, gradiente morado, hero de partículas, iconos como sistema visual, y el tema por defecto de shadcn/ui.
- Dibujos planos genéricos o inicios vacíos: cada variante cuenta con fotografía real de alta resolución (`lib/catalog/photo-registry.ts`) respaldada por renders arquitectónicos de estudio en `public/brand/photos/*.jpg` y `public/brand/seed/*.svg`.
- Inventar endpoints. El timbrado CFDI se implementa con la documentación oficial vigente de Facturapi.

---

## 3. Paquetes y servicios

Dependencias de producto:

- `next`, `react`, `react-dom`, `typescript`, `tailwindcss`
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod`
- `motion` (importar desde `motion/react`)
- `lucide-react` solo como apoyo técnico, nunca como estilo de la marca

Desarrollo y auditoría:

- `eslint`, `prettier`, `husky`, `lint-staged`
- `@playwright/test`
- `@axe-core/playwright`
- `vitest` para dinero, IVA y stock
- Supabase CLI local

Scripts npm obligatorios: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:types`, `db:lint`.

---

## 4. Sistema de diseño — Lumen Editorial Luxury

Tokens en `app/styles/tokens.css`:

```css
:root {
  --ink: #1c1712;
  --ink-soft: #4a433c;
  --paper: #f3eee6;
  --paper-2: #e7e0d4;
  --stone: #d8cfc2;
  --brass: #8d6840;
  --brass-2: #c4a27a;
  --clay: #9c4630;
  --pine: #243f34;
  --line: rgba(28, 23, 18, 0.14);
  --line-strong: rgba(28, 23, 18, 0.28);
  --danger: #8e2f24;
  --ok: #2d5a45;
  --shadow: 0 24px 60px rgba(28, 23, 18, 0.08);
  --radius-s: 2px;
  --radius-m: 6px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --fast: 180ms;
  --base: 420ms;
  --slow: 720ms;
  --font-display: "Fraunces", "Iowan Old Style", "Palatino Linotype", serif;
  --font-ui: "Schibsted Grotesk", "Avenir Next", "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

- Cargar Fraunces (ejes `SOFT` y `opsz`), Schibsted Grotesk e IBM Plex Mono con `display: swap`.
- Todos los radios de controles, tarjetas e imágenes se mantienen `<= 6px` (`--radius-s: 2px`, `--radius-m: 6px`), preservando el corte arquitectónico de galería.
- Header fijo de 64px (`h-16`), fondo papel al 92% con `backdrop-blur-sm`, wordmark en display, navegación a `Destacados`, `Piezas`, `Iluminación`, `Tecnología`, `Espacios` y `Reseñas`, y contador de carrito en vivo.
- Toda animación con `motion/react` respeta `prefers-reduced-motion: reduce` sin alterar la estructura DOM entre servidor y cliente (cero errores de hidratación).
