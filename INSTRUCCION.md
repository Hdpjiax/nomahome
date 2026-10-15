# INSTRUCCIÓN ÚNICA — TIENDA CASA LUMEN

Ejecuta este documento completo, de la fase 0 a la fase 10, en este mismo turno de trabajo. No pidas confirmación entre fases. No entregues un resumen en lugar del código. No uses un template visual. Si falta un secreto, deja la integración cableada, el botón de pago deshabilitado y `.env.example` documentado; nunca simules un pago aprobado.

Sustituye solo estos valores si el humano los escribió encima. Si no, usa los defaults.

```yaml
marca: NOMAHOME
tagline: Muebles y tecnología para vivir la casa
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

## 1. Misión

Construir desde cero una tienda de muebles y tecnología para el hogar. Debe verse editorial y propia, no como un theme de Shopify, no como un dashboard shadcn y no como una landing SaaS.

El comprador recorre inicio, categorías, ficha completa, agregado rápido, reseñas, cuenta, carrito y checkout sin salir del sitio para pagar. El admin carga un producto completo, lo mueve de categoría, reordena pestañas y ve pagos y facturas en el mismo admin.

Stack fijo: Next.js App Router, TypeScript strict, Tailwind con tokens propios, Supabase (Postgres, Auth, Storage, RLS), Vercel.

Cobro fijo:pasarela prpopia, tarjeta y direccion de facturacion mostrados para el admin

Factura fija: UI propia. Timbrado CFDI 4.0 con el paquete `facturapi`. Un PDF generado aquí no es factura.

---

## 2. Reglas duras

Prohibido, sin excepción:


- Marcar `orders.status = paid` desde el cliente, desde WhatsApp o sin webhook con firma válida.
- Poner `SUPABASE_SERVICE_ROLE_KEY` `NEXT_PUBLIC_`.
- Desactivar RLS, usar el service role en componentes cliente, o confiar en un rol guardado solo en `localStorage`.
- `any`, `@ts-ignore` y precios calculados solo en el navegador.
- Inter, Roboto, Geist, Arial, cards zinc, gradiente morado, hero de partículas, iconos como sistema visual, y el tema por defecto de shadcn/ui.
- Fotos de Unsplash, Pexels o placeholders repetidos como diseño final. El seed usa piezas SVG propias del repo. El admin sube las fotos reales.
- Inventar endpoints. Cobro y CFDI se implementan con la documentación oficial vigente de Mercado Pago y Facturapi.

Si una herramienta de esta instrucción no está instalada, instálala. Si una pantalla parece template, redíséñala antes de seguir.

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

Variables en `.env.example`, sin valores reales:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_E164=5214430000000
PAYMENTS_MODE=sandbox
```


---

## 4. Árbol que debes crear

```text
app/
  (store)/page.tsx
  (store)/categoria/[slug]/page.tsx
  (store)/producto/[slug]/page.tsx
  (store)/producto/[slug]/agregar/page.tsx
  (store)/resenas/page.tsx
  (store)/buscar/page.tsx
  (store)/contacto/page.tsx
  (store)/envios/page.tsx
  (store)/devoluciones/page.tsx
  (store)/privacidad/page.tsx
  (store)/terminos/page.tsx
  (account)/cuenta/page.tsx
  (account)/cuenta/pedidos/page.tsx
  (account)/cuenta/direcciones/page.tsx
  (account)/cuenta/facturacion/page.tsx
  (account)/cuenta/favoritos/page.tsx
  (checkout)/carrito/page.tsx
  (checkout)/checkout/page.tsx
  (checkout)/pedido/[id]/page.tsx
  admin/layout.tsx
  admin/page.tsx
  admin/productos/page.tsx
  admin/productos/[id]/page.tsx
  admin/categorias/page.tsx
  admin/pedidos/page.tsx
  admin/pagos/page.tsx
  admin/facturas/page.tsx
  admin/resenas/page.tsx
  admin/inicio/page.tsx
  api/webhooks/mercadopago/route.ts
  api/webhooks/facturapi/route.ts
  design-system/page.tsx
components/store/
components/admin/
components/motion/
lib/supabase/
lib/payments/
lib/invoicing/
lib/validators/
lib/money/
lib/whatsapp.ts
supabase/migrations/
supabase/seed.sql
tests/e2e/
tests/unit/
public/brand/
.github/workflows/ci.yml
.github/workflows/codeql.yml
.github/dependabot.yml
.github/pull_request_template.md
AGENTS.md
CLAUDE.md
.cursor/rules/casa-lumen.mdc
.agents/skills/*/SKILL.md
.claude/skills/*/SKILL.md
```

Las skills de abajo se materializan en `.agents/skills/<name>/SKILL.md` y se copian igual a `.claude/skills/<name>/SKILL.md`. `AGENTS.md` y `CLAUDE.md` contienen las reglas duras y apuntan a las skills. No dejes este documento solo en el chat: cópialo también a `INSTRUCCION.md` en la raíz.

---

## 5. Sistema de diseño

Nombre interno del sistema: Lumen Editorial. Es un catálogo impreso puesto en pantalla. Mucho papel, poca interfaz, fotografía o materia a sangre, números de pieza como en una ficha de taller.

### Tokens

Crear `app/styles/tokens.css` e importarlo en el layout raíz.

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
  --danger: #8e2f24;
  --ok: #2d5a45;
  --shadow: 0 24px 60px rgba(28, 23, 18, 0.08);
  --radius-s: 2px;
  --radius-m: 6px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 20px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 80px;
  --space-8: 120px;
  --max: 1440px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --fast: 180ms;
  --base: 420ms;
  --slow: 720ms;
  --font-display: "Fraunces", "Iowan Old Style", "Palatino Linotype", serif;
  --font-ui: "Schibsted Grotesk", "Avenir Next", "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

Cargar Fraunces (ejes soft y optical size), Schibsted Grotesk e IBM Plex Mono desde el loader de fuentes de Next, con `display: swap`. No usar Inter, Geist ni Roboto.

Tailwind debe mapear estos tokens. Nada de `bg-zinc-900`, `text-gray-500` ni `rounded-2xl` como lenguaje visual. El radio máximo de un control es 6px. Los botones primarios son tinta sobre papel o papel sobre tinta, no cápsulas.

### Composición

- Fondo `--paper`. Texto `--ink`. El latón es un acento de 4px o de un filete, no un gradiente.
- Grid de 12 columnas. El home no es un grid uniforme de 4 cards. La primera pieza de cada bloque ocupa 7 columnas y el texto 5, alternando.
- Números de catálogo visibles: `CL-SOF-220`. Tipografía mono, tracking 0.08em, tamaño 12px.
- Titulares display en Fraunces, 64–112px en desktop, tracking -0.03em, interlineado 0.92. Nunca centrados todos. El titular del home va alineado a la izquierda y se corta con una foto que entra desde la derecha.
- Fichas de producto: imagen 4:5, nombre, material, precio. Sin borde gris, sin sombra de card, sin badge “NEW” en píldora. La separación es el papel, no la caja.
- Header fijo de 64px, fondo papel al 92% con blur suave, wordmark en display, navegación en mono pequeña: Piezas, Tecnología, Oficio, Reseñas. Carrito es un número, no un icono de bolsa gigante.
- Footer editorial: taller en Morelia, horarios, WhatsApp, legales. Sin columnas de “solutions / company / resources”.

### Motion

Usar `motion/react`. Toda animación respeta `prefers-reduced-motion: reduce` y queda en opacidad instantánea.

- Entrada de página: fade 420ms y 12px de desplazamiento, ease `--ease`. Sin bounce.
- Cambio de color en ficha: crossfade de 480ms entre dos imágenes del mismo encuadre. El swatch no gira.
- Agregado rápido: sheet desde la derecha, 420ms, fondo tinta al 28%. En móvil, desde abajo, altura 92dvh.
- Precio: no cuenta regresiva falsa ni “alguien lo está viendo”.
- Scroll: un solo bloque del home puede revelar medidas con `whileInView`. Prohibido Lenis global si rompe el ancla de accesibilidad o el scroll del sheet.
- Hover de pieza en desktop: la imagen escala 1.03 en 700ms. Nada más.

### Voz

Español de México, tuteo, frases cortas. Se habla de piezas, tela, madera, luz y medida. No se dice “descubre la magia”, “eleva tu estilo de vida” ni “solución integral”. Ejemplo de titular: “Una mesa que aguanta la lámpara y la conversación.” Ejemplo de botón: “Agregar al carrito”. Ejemplo de error: “Ese color ya no tiene piezas en taller.”

### Página `/design-system`

Solo en desarrollo. Muestra color, tipo, botones, swatch, sheet, ficha, precio con IVA desglosado y el estado vacío del carrito. Si esta página se ve genérica, el resto también lo está: corrígela primero.

### Anti-patrones visuales

Rechaza y rehaz si aparece cualquiera de estos: hero a pantalla completa con texto centrado y botón gradiente; tres columnas de beneficios con icono redondo; carrusel automático; “confiado por” logos; testimonios en cards blancas con estrellas amarillas de emoji; navbar con búsqueda enorme y mega-menú gris; product card con sombra y botón azul “Add to cart”.

---

## 6. Skills que debes escribir en disco

Cada skill lleva frontmatter `name` y `description`. El `name` coincide con la carpeta. Al trabajar una de estas tareas, sigue la skill correspondiente además de este documento.

### `.agents/skills/diseno-original/SKILL.md`

```markdown
---
name: diseno-original
description: Usar al crear o modificar cualquier UI de Casa Lumen, layout, motion, tokens, home, ficha, carrito o admin. Obliga el sistema Lumen Editorial y prohíbe looks de template.
---

# Diseño original

1. Lee `app/styles/tokens.css` antes de crear un componente.
2. Usa solo `--ink`, `--paper`, `--stone`, `--brass`, `--clay`, `--pine` y las fuentes Fraunces, Schibsted Grotesk e IBM Plex Mono.
3. Compón en asimetría. Una pieza grande, texto al lado, filete de 1px `--line`.
4. Motion solo con `motion/react`, duraciones `--fast`, `--base`, `--slow`, ease `--ease`.
5. Implementa `prefers-reduced-motion`.
6. No importes un theme kit. Si un componente nace pareciendo shadcn, bórralo y redibújalo.
7. Admin usa la misma materia visual, con densidad mayor y mono para datos. No es un panel gris de Bootstrap.
8. Antes de cerrar una pantalla, compárala con la lista de anti-patrones de INSTRUCCION.md.
```

### `.agents/skills/catalogo-producto/SKILL.md`

```markdown
---
name: catalogo-producto
description: Usar al modelar productos, variantes, colores, fotos, categorías, agregado rápido, ficha, búsqueda o reseñas de Casa Lumen.
---

# Catálogo

1. Un producto tiene variantes. El color, el SKU, el precio y el stock viven en la variante, no solo en el padre.
2. Cada variante tiene al menos una imagen ordenada. Cambiar color cambia la galería.
3. La ficha `/producto/[slug]` muestra galería, swatches, medidas, materiales, tecnología, envío, reseñas verificadas, relacionados y JSON-LD Product.
4. El agregado rápido existe en dos sitios: sheet en listados y ruta `/producto/[slug]/agregar`. Ambos escriben el mismo carrito.
5. El precio mostrado sale de `lib/money`. El servidor recalcula al agregar y al cobrar.
6. Solo reseñas de un usuario con un pedido pagado de esa variante pueden publicarse. El admin modera.
7. Categorías son árbol de un nivel en v1: Muebles, Iluminación, Tecnología del hogar, Textiles. Un producto puede estar en varias. El admin puede moverlo.
```

### `.agents/skills/checkout-mercadopago/SKILL.md`

```markdown
---
name: checkout-mercadopago
description: Usar al implementar carrito, checkout, Payment Brick, webhooks, estados de pedido o el ledger de pagos. Nunca capturar tarjeta en servidores propios.
---

# Checkout Propia

1. Renderiza Payment Brick dentro de `/checkout`, con textos y colores de Lumen Editorial. El comprador no sale del sitio.
3. El monto, la descripción y el `external_reference` (id del pedido) se crean en el servidor. El cliente no envía el total.
4. El access token solo se usa en Route Handlers o Server Actions.
5. lee `cardNumber`, `securityCode` y los guardes en estado de React, logs, Supabase o analytics.
6. El webhook `/api/webhooks/mercadopago` verifica la firma según la documentación oficial vigente. Si la firma falla, responde 401 y no cambia el pedido.
7. El handler es idempotente por id de pago del proveedor. Un reintento no descuenta stock dos veces.
8. Solo un pago aprobado, con monto igual al pedido, pasa `orders.status` a `paid` y descuenta stock.
10. publica una CLABE propia como cobro automático.
11. WhatsApp confirma pagos. El enlace `wa.me` lleva folio, SKU y total como texto.
```

### `.agents/skills/facturacion-cfdi/SKILL.md`

```markdown
---
name: facturacion-cfdi
description: Usar al pedir, timbrar, mostrar, reenviar o cancelar CFDI 4.0 de Casa Lumen con Facturapi.
---

# Facturación

1. Instala `facturapi`. La llave vive en `FACTURAPI_KEY` de servidor.
2. El cliente, en `/cuenta/facturacion`, captura RFC, nombre o razón social, régimen fiscal, uso CFDI y código postal. Valida con Zod. No inventes el catálogo del SAT: usa los catálogos que exponga Facturapi o una tabla semilla con los usos y regímenes vigentes que documente el SAT, citada en comentario con la fuente oficial.
3. Solo un pedido `paid` puede timbrarse, una sola vez, salvo cancelación previa.
4. Guarda `uuid`, `status`, `xml_url`, `pdf_url`, `total` y `order_id`. No generes un XML firmado por este repo.
5. El admin ve, reenvía y solicita cancelación desde `/admin/facturas`.
6. Si no hay llave, muestra el formulario y un estado “timbrado no configurado”. No generes un PDF con sello falso.
```

### `.agents/skills/admin-catalogo/SKILL.md`

```markdown
---
name: admin-catalogo
description: Usar al construir el panel admin de productos, fotos, colores, pestañas, categorías, reseñas, pedidos, pagos o facturas.
---

# Admin

1. El layout admin exige sesión y `profiles.role = admin` verificado en servidor. Un layout cliente no basta.
2. Alta y edición cubren: nombre, slug, SKU padre, descripción, categorías, pestañas ordenables, variantes, color, material, medidas, precio, compare-at, stock, IVA incluido, fotos, alt, video URL opcional, SEO title y description, publicado.
3. Sube fotos a Supabase Storage en el bucket `product-media`. Optimiza en servidor. Guarda path, ancho, alto, alt y orden.
4. Reordenar pestañas de la ficha y bloques del home persiste `sort_order`.
5. Mover de categoría es una acción explícita, con auditoría en `audit_logs`.
6. Pagos y facturas son solo lectura operativa más reenvío y cancelación de CFDI. No hay formulario para “registrar tarjeta”.
7. Cada mutación admin escribe `audit_logs` con actor, acción, entidad e id.
```

### `.agents/skills/auditoria-seguridad/SKILL.md`

```markdown
---
name: auditoria-seguridad
description: Usar antes de dar por cerrada una fase, al tocar auth, RLS, webhooks, headers, CI o deploy de Casa Lumen.
---

# Auditoría

1. `npm run typecheck`, `lint`, `test` y `build` en verde.
2. Gitleaks o el secret scan de CI no encuentra llaves.
3. Busca en el bundle del cliente: `service_role`, `ACCESS_TOKEN`, `FACTURAPI`. Si aparece, es un fallo.
4. Tests RLS: anónimo no lee `orders` ni `payments`; usuario no lee pedidos ajenos; usuario no inserta en `products`.
5. Webhook sin firma válida no cambia estado.
6. Headers en `next.config`: CSP, HSTS en producción, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors de la propia app.
7. Lighthouse en `/` y en una ficha: LCP menor a 2.5 s en preview, CLS menor a 0.1. axe sin violaciones críticas en home, ficha y checkout.
8. No marques la fase 10 como hecha si alguno de estos falla.
```

---

## 7. Modelo de datos

Escribe migraciones SQL versionadas, no cambios a mano en el dashboard. Habilita RLS en todas las tablas. `updated_at` con trigger.

Tablas:

- `profiles`: `id` uuid pk references auth.users, `full_name`, `role` text check in (`customer`,`admin`) default `customer`, `phone`
- `categories`: `id`, `slug` unique, `name`, `description`, `sort_order`, `parent_id` null
- `products`: `id`, `slug` unique, `sku`, `name`, `summary`, `description`, `published` bool, `seo_title`, `seo_description`
- `product_categories`: `product_id`, `category_id`, pk compuesta
- `colors`: `id`, `name`, `hex`
- `product_variants`: `id`, `product_id`, `sku` unique, `color_id`, `material`, `width_cm`, `depth_cm`, `height_cm`, `weight_kg`, `price_cents` int, `compare_at_cents` int null, `stock` int, `published` bool
- `product_media`: `id`, `variant_id`, `path`, `alt`, `width`, `height`, `sort_order`
- `product_tabs`: `id`, `product_id`, `title`, `body` text, `sort_order`
- `homepage_blocks`: `id`, `kind`, `title`, `body`, `product_id` null, `sort_order`, `published`
- `reviews`: `id`, `variant_id`, `user_id`, `order_id`, `rating` int check 1-5, `title`, `body`, `status` check in (`pending`,`published`,`rejected`)
- `addresses`: `id`, `user_id`, `recipient`, `line1`, `line2`, `city`, `state`, `postal_code`, `phone`, `is_default`
- `carts`: `id`, `user_id` null, `session_id`, `status`
- `cart_items`: `id`, `cart_id`, `variant_id`, `qty` int check > 0
- `orders`: `id`, `user_id`, `email`, `status` check in (`pending_payment`,`paid`,`cancelled`,`fulfilled`), `subtotal_cents`, `shipping_cents`, `tax_cents`, `total_cents`, `address_snapshot` jsonb
- `order_items`: `id`, `order_id`, `variant_id`, `name_snapshot`, `sku_snapshot`, `unit_price_cents`, `qty`
- `payments`: `id`, `order_id`, `provider` text default `, `provider_payment_id` unique, `status`, `method`, `amount_cents`, `fee_cents`, `net_cents`, `raw_status` text. Sin columnas de tarjeta.
- `invoices`: `id`, `order_id` unique, `rfc`, `legal_name`, `tax_regime`, `cfdi_use`, `postal_code`, `uuid`, `status`, `xml_url`, `pdf_url`
- `favorites`: `user_id`, `product_id`, pk compuesta
- `audit_logs`: `id`, `actor_id`, `action`, `entity`, `entity_id`, `created_at`

Índices en slugs, `provider_payment_id`, `orders.user_id`, `reviews.variant_id`.

RLS, en este sentido exacto:

- Anónimo y autenticado leen categorías, productos, variantes, media y tabs solo si `published = true`.
- Insert/update/delete de catálogo: solo `profiles.role = admin`.
- `orders`, `order_items`, `payments`, `invoices`, `addresses`: el dueño lee las suyas; admin lee todas. El cliente no inserta pagos ni cambia `orders.status`.
- Escritura de pedidos y pagos: solo service role desde el servidor, o una policy que el cliente no pueda cumplir. Prefiere que el Route Handler use service role y el cliente no tenga policy de escritura sobre `payments`.
- `reviews`: el usuario inserta `pending` solo si existe un `order_items` de esa variante en un pedido suyo `paid`. Update de status: solo admin. Lectura pública: solo `published`.
- Storage `product-media`: lectura pública de objetos publicados; escritura solo admin.

Seed de 12 piezas, mezcla de mueble y tecnología del hogar, 3 colores en al menos 4 productos, stock realista, precios en centavos MXN, IVA incluido en el precio de vitrina. Ejemplos de nombres, no genéricos en inglés: Sofá Norte 220, Mesa de roble Lerma, Lámpara de mesa Pátzcuaro, Silla de comedor Quiroga, Buró de noche Tzintzuntzan, Estante de acero Morelia, Bocina de estantería Cuitzeo, Lámpara de pie Mil Cumbres, Router de hogar encubierto en caja de roble, Purificador de aire para sala, Hub de cortinas motorizadas, Barra de sonido para mueble bajo. Las imágenes del seed son SVG propios en `public/brand/seed/`, con la paleta del sistema, el nombre de la pieza y una composición geométrica distinta por SKU. No descargues fotos de stock.

Envío v1: tabla no hace falta. Función `shippingCents(subtotal, state)` en `lib/money`: 0 si subtotal >= 1500000 centavos, si no 24900 dentro de Michoacán y 39900 al resto de México. Documenta que cotizar paquetería real es fase posterior.

---

## 8. Páginas y comportamiento

### Inicio `/`

Bloques ordenados por `homepage_blocks`. Apertura con una pieza grande y un párrafo de taller. Luego una franja de categorías que no son iconos: son recortes de materia. Después cuatro piezas en composición asimétrica. Cierra con una nota de oficio y el WhatsApp. Metadata y Open Graph propios, no el título por defecto de Next.

### Categoría `/categoria/[slug]`

Filtros en URL: `color`, `material`, `precio_min`, `precio_max`, `orden`. Grid editorial. Cada pieza tiene “Ver pieza” y “Agregar”, este abre el sheet. Estado vacío con una frase de taller, no una ilustración de caja vacía de kit.

### Ficha `/producto/[slug]`

Galería, swatches con nombre y hex, precio, stock, medidas, pestañas ordenadas por el admin, reseñas publicadas, relacionados de la misma categoría. Selector de cantidad. Botón “Agregar al carrito” y enlace “Elegir rápido” a la ruta ligera. JSON-LD `Product` con offers en MXN. Si la variante no tiene stock, el botón dice “Avisar al taller” y abre WhatsApp; no permite checkout de stock 0.

### Agregado rápido

Sheet y `/producto/[slug]/agregar` comparten el componente `QuickAdd`. Muestra foto, color, cantidad, precio y envío estimado. Confirmar escribe `cart_items` y muestra el mini-estado del carrito. No es una segunda ficha recortada con el mismo scroll infinito.

### Reseñas `/resenas`

Listado de reseñas `published`, filtro por categoría, enlace a la pieza. No se inventan testimonios en el seed. Si no hay reseñas, la página lo dice.

### Buscar `/buscar`

Postgres full text en español sobre nombre, summary y material. Resultados con la misma celda de catálogo.

### Carrito `/carrito`

Líneas con foto, color, qty editable, quitar, subtotal, envío estimado, IVA desglosado y total. El IVA se informa como incluido. CTA “Continuar al pago” lleva a checkout. Si no hay sesión, permite seguir como invitado y pide email en checkout.

### Checkout `/checkout`

Misma materia visual. Pasos en una sola página, no un wizard de tres sitios externos: datos, dirección mexicana, resumen, Payment Brick. Al confirmar datos, el servidor crea el pedido `pending_payment` con totales recalculados y monta el Brick con ese id como referencia. Debajo, enlace de WhatsApp “Hablar del pedido” que no toca el estado.

### Pedido `/pedido/[id]`

Solo el dueño o el email invitado dueño del token de pedido firmado. Muestra folio, piezas, estado real y, si está pagado, acceso a pedir factura. No muestres datos de otros clientes.

### Cuenta

Pedidos, direcciones, favoritos, datos fiscales. Auth de Supabase por email mágico o contraseña. Tras el alta, existe `profiles` mediante trigger.

### Contacto y legales

`/contacto` con WhatsApp y un formulario que guarda un mensaje en `audit_logs` o en una tabla `messages` con RLS de insert anónimo limitado por rate limit de servidor. Páginas de envíos, devoluciones, privacidad y términos en español, específicas de muebles: plazos de taller, daños en transporte, devolución de 7 días en piezas sin uso. No copies un texto legal de otro sitio.

### Admin

- `/admin` resumen: pedidos por cobrar, pagados hoy, stock bajo, reseñas pendientes.
- Productos: tabla densa, crear, editar, publicar, duplicar variante.
- Editor: columnas de datos y una previsualización de la ficha. Drag de pestañas y de fotos persiste orden.
- Categorías: reordenar y mover producto.
- Inicio: reordenar bloques.
- Pedidos: estado de surtido, no de pago. El pago no se edita a mano salvo una acción admin “marcar revisión”, que no equivale a `paid`.
- Pagos: provider id, método, monto, comisión, neto, estado, enlace al pedido. Vacío si no hay webhook.
- Facturas: RFC, UUID, estado, reenviar, cancelar.
- Reseñas: publicar o rechazar.

---

## 9. Dinero, cobro y factura

`lib/money` trabaja en centavos enteros. Funciones puras con test: `taxIncludedCents`, `splitIva`, `shippingCents`, `lineTotal`, `orderTotal`. Redondeo half away from zero al centavo. No uses flotantes para cobrar.

Flujo:

1. Checkout crea pedido pendiente con snapshot de dirección y de precios.
2. El servidor registra la intención con Mercado Pago y devuelve solo lo que el Brick necesita.
3. El Brick cobra. El navegador no decide el estado final.
4. Webhook firmado actualiza `payments` y, si aplica, `orders` y stock.
5. La dispersión a la cuenta bancaria ocurre en Mercado Pago, hacia la cuenta que el comercio registró allí. Este software no implementa SPEI de salida ni guarda la CLABE como destino de tarjetas.
6. Un pedido pagado puede timbrarse. Facturapi devuelve UUID, XML y PDF. Se guardan las URLs o los archivos en un bucket privado `invoices` con lectura solo del dueño y admin.

WhatsApp: `https://wa.me/<e164>?text=` con texto codificado: marca, folio si existe, SKU, color, cantidad. Función única en `lib/whatsapp.ts`.

Errores de cobro se muestran en la misma página, en español, sin el JSON del proveedor.

---

## 10. Herramientas de GitHub y CI

Crear los archivos, no solo mencionarlos.

`.github/dependabot.yml` con updates semanales de npm y github-actions.

`.github/workflows/ci.yml` en pull request y push a main:

- checkout, setup-node 22, `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm audit --audit-level=high`
- gitleaks-action sobre el repo
- Playwright en el flujo anónimo de ver ficha y abrir agregado rápido. El pago sandbox corre solo si el secreto `MERCADOPAGO_ACCESS_TOKEN` está en GitHub Environments; si no, el job se marca skipped, no verde falso.

`.github/workflows/codeql.yml` con el workflow oficial de CodeQL para `javascript-typescript`.

`next.config` exporta security headers. CSP permite los dominios que la documentación vigente de Mercado Pago exija para el Brick y bloquea el resto. No uses `unsafe-eval` en producción si el Brick no lo requiere; si la doc oficial lo exige, aíslalo en comentario con la URL de la doc.

`AGENTS.md` y `CLAUDE.md` repiten las reglas duras en menos de 120 líneas y listan las seis skills. `.cursor/rules/casa-lumen.mdc` tiene `alwaysApply: true` y las mismas prohibiciones visuales y de pago.

Plantilla de PR: qué fase cierra, capturas de home y ficha, resultado de RLS, confirmación de que no hay datos de tarjeta.

Instalar en el repositorio de GitHub, cuando exista remoto: integración de Vercel, integración de Supabase, Dependabot, secret scanning y CodeQL. Documenta esos clics en `DEPLOY.md` en cinco líneas. No pidas al humano que diseñe.

---

## 11. Fases

Ciérralas en orden. Al terminar cada una, el código de esa fase corre. No dejes TODOs de la fase en curso.

0. Repo, TypeScript strict, tokens, layout, header, footer, `/design-system`, CI mínimo en verde, skills en disco, `INSTRUCCION.md`.
1. Migraciones, RLS, trigger de profile, seed SVG, tipos generados, `lib/money` con tests.
2. Home, categoría, búsqueda, metadata, sitemap, robots.
3. Ficha, quick add, carrito de invitado y de usuario.
4. Auth, cuenta, direcciones, favoritos.
5. Checkout con Brick, creación de pedido, webhook firmado e idempotente, página de pedido. Sandbox si hay llaves; bloqueado con explicación si no hay.
6. Reseñas con compra verificada y moderación.
7. Admin de catálogo, media, pestañas, categorías y home.
8. Admin de pagos y facturas. Timbrado sandbox si hay `FACTURAPI_KEY`.
9. Motion, reduced motion, estados vacíos, JSON-LD, axe en las tres pantallas críticas.
10. Auditoría de la skill `auditoria-seguridad`, `DEPLOY.md`, preview de Vercel si el CLI o la integración están autenticados. Si no hay token de Vercel, deja el proyecto listo y escríbelo; no finjas el deploy.

---

## 12. Hecho

Esto está terminado solo si un extraño puede:

- abrir el home y reconocer un catálogo de taller, no un template;
- filtrar una categoría, cambiar el color de una pieza y ver otra imagen;
- agregar rápido y también abrir la ficha completa;
- comprobar que un webhook inválido no marca el pedido pagado;
- entrar como admin, crear una variante con fotos, moverla de categoría, reordenar una pestaña y ver el ledger;
- pedir una factura solo con pedido pagado, sin un XML casero;
- escribir por WhatsApp con el SKU en el mensaje;
- ver CI sin secretos filtrados y RLS cubriendo pedidos ajenos.

