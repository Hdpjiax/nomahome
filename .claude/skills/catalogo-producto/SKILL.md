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
