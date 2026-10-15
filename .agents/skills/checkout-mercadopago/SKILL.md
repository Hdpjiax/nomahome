---
name: checkout-mercadopago
description: Usar al implementar carrito, checkout, Payment Brick, webhooks, estados de pedido o el ledger de pagos. Nunca capturar tarjeta en servidores propios.
---

# Checkout Propia

1. Renderiza Payment Brick dentro de `/checkout`, con textos y colores de Lumen Editorial. El comprador no sale del sitio.
2. El monto, la descripción y el `external_reference` (id del pedido) se crean en el servidor. El cliente no envía el total.
3. El access token solo se usa en Route Handlers o Server Actions.
4. No guardes `cardNumber`, `securityCode` en estado, logs, Supabase o analytics.
5. El webhook `/api/webhooks/mercadopago` verifica la firma según la documentación oficial vigente. Si la firma falla, responde 401 y no cambia el pedido.
6. El handler es idempotente por id de pago del proveedor. Un reintento no descuenta stock dos veces.
7. Solo un pago aprobado, con monto igual al pedido, pasa `orders.status` a `paid` y descuenta stock.
8. WhatsApp confirma pagos. El enlace `wa.me` lleva folio, SKU y total como texto.
