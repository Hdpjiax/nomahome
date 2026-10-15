import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchInvoice, isFacturapiConfigured } from '@/lib/invoicing/facturapi';

/**
 * Webhook de Facturapi (facturapi.io/docs/webhooks).
 *
 * La carga de los webhooks de Facturapi no trae firma HMAC, así que no se
 * confía en ella: el evento SOLO se aplica tras verificar el estado real
 * de la factura contra la API de Facturapi con la llave del servidor.
 * Sin llave: 503 y no cambia nada (regla dura §2).
 */
export async function POST(request: NextRequest) {
  if (!isFacturapiConfigured()) {
    return NextResponse.json(
      { message: 'Timbrado no configurado.' },
      { status: 503 }
    );
  }

  let event: { data?: { id?: string }; type?: string };
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo no es JSON.' }, { status: 400 });
  }

  const providerInvoiceId = event.data?.id;
  if (!providerInvoiceId) {
    return NextResponse.json({ message: 'Sin id de factura.' }, { status: 422 });
  }

  // Verificación contra la fuente: el evento no manda, la API sí.
  const remote = await fetchInvoice(providerInvoiceId);
  if (!remote) {
    return NextResponse.json(
      { message: 'La factura no existe en Facturapi; no se aplica nada.' },
      { status: 404 }
    );
  }

  const admin = createAdminClient();
  const { data: local } = await admin
    .from('invoices')
    .select('id, status')
    .eq('provider_invoice_id', providerInvoiceId)
    .maybeSingle();

  if (!local) {
    // Facturas de otras organizaciones u orígenes: se ignora.
    return NextResponse.json({ message: 'Factura no registrada aquí.' }, { status: 200 });
  }

  const remoteStatus = remote.status === 'canceled' ? 'canceled' : 'stamped';
  if (remoteStatus !== local.status) {
    await admin
      .from('invoices')
      .update({
        status: remoteStatus,
        ...(remoteStatus === 'stamped' && remote.uuid ? { uuid: remote.uuid } : {}),
      })
      .eq('id', local.id);
  }

  return NextResponse.json({ message: 'Verificado contra Facturapi.' }, { status: 200 });
}
