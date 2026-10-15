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
