---
name: facturacion-cfdi
description: Usar al pedir, timbrar, mostrar, reenviar o cancelar CFDI 4.0 de Casa Lumen con Facturapi.
---

# Facturación

1. Instala `facturapi`. La llave vive en `FACTURAPI_KEY` de servidor.
2. El cliente, en `/cuenta/facturacion`, captura RFC, nombre o razón social, régimen fiscal, uso CFDI y código postal. Valida con Zod. No inventes el catálogo del SAT: usa los catálogos que exponga Facturapi.
3. Solo un pedido `paid` puede timbrarse, una sola vez, salvo cancelación previa.
4. Guarda `uuid`, `status`, `xml_url`, `pdf_url`, `total` y `order_id`. No generes un XML firmado por este repo.
5. El admin ve, reenvía y solicita cancelación desde `/admin/facturas`.
6. Si no hay llave, muestra el formulario y un estado "timbrado no configurado". No generes un PDF con sello falso.
