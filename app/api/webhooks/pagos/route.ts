import { NextResponse, type NextRequest } from 'next/server';
import { processWebhookEvent } from '@/lib/payments/webhook';

/**
 * Webhook de pagos — POST /api/webhooks/pagos.
 * Firma HMAC-SHA256 en el header x-signature sobre el cuerpo crudo.
 * Solo existe en sandbox. Sin firma válida: 401 y no cambia nada.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  const result = await processWebhookEvent(rawBody, signature);
  return NextResponse.json({ message: result.message }, { status: result.status });
}
