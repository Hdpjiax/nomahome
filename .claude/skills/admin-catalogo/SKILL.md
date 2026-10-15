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
6. Pagos y facturas son solo lectura operativa más reenvío y cancelación de CFDI. No hay formulario para "registrar tarjeta".
7. Cada mutación admin escribe `audit_logs` con actor, acción, entidad e id.
