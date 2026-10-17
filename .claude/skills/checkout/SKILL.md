---
name: checkout
description: Usar al implementar carrito, checkout, cobro por SPEI, confirmación de pagos, webhooks, estados de pedido o el ledger de pagos. Nunca capturar tarjeta en servidores propios.
---

# Cobro propio — checkout del taller

1. El checkout de `/checkout` se queda en el sitio, con textos y colores de Lumen Editorial. Cobro propio = transferencia SPEI entrante a la CLABE del taller (`NEXT_PUBLIC_STORE_CLABE`). Nunca una pasarela casera que pida número de tarjeta o código de seguridad.
2. El monto, la descripción y la referencia del pedido (`public_ref`) se crean en el servidor. El cliente no envía el total.
3. `SUPABASE_SERVICE_ROLE_KEY` solo se usa en Route Handlers o Server Actions.
4. Jamás se capturan `cardNumber` ni `securityCode`: no se piden, no se guardan en estado de React, logs, Supabase ni analytics. `payments` no tiene columnas de tarjeta y no se agregan.
5. El pedido nace `pending_payment`. Solo pasa a `paid` por: (a) confirmación del taller — Server Action con rol admin verificado en servidor, idempotente, con registro en `audit_logs` — o (b) un evento firmado con HMAC válido y monto igual al total.
6. En `PAYMENTS_MODE=sandbox` existe un endpoint de simulación que emite el evento firmado para probar el flujo completo (pago aprobado simulado). Fuera de sandbox responde 404 y no cambia nada. El webhook `/api/webhooks/pagos` verifica la firma HMAC del cuerpo crudo; si la firma falla, responde 401 y no cambia el pedido.
7. El handler es idempotente por id de pago. Un reintento no descuenta stock dos veces.
8. Solo un pago aprobado con monto igual al pedido pasa `orders.status` a `paid` y descuenta stock.
9. La CLABE del taller es pública; se muestra en el checkout junto a la referencia del pedido. Este software no hace dispersiones SPEI de salida: el dinero llega a la cuenta del taller y ahí se queda.
10. WhatsApp acompaña el pedido pero jamás cambia su estado. El enlace `wa.me` lleva folio, SKU y total como texto.
