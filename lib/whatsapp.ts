/**
 * WhatsApp del taller — función única (INSTRUCCION.md §9).
 * El enlace wa.me lleva texto codificado con marca, folio si existe, SKU
 * y total. WhatsApp acompaña el pedido: jamás cambia su estado.
 */

export const WHATSAPP_E164 =
  process.env.NEXT_PUBLIC_WHATSAPP_E164 || '5215539042880';

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

/** Mensaje de consulta general. */
export function waQuestion(pieceName?: string): string {
  return pieceName
    ? `Hola NOMAHOME. Quiero preguntar por la pieza ${pieceName}.`
    : 'Hola NOMAHOME. Tengo una pregunta para el taller.';
}

/** Mensaje de pedido: folio si existe, SKU, color, cantidad y total. */
export function waOrder(parts: {
  folio?: string | null;
  lines: { sku: string; color?: string; qty: number }[];
  total?: string;
}): string {
  const lines = parts.lines
    .map((l) => `${l.sku}${l.color ? ` (${l.color})` : ''} × ${l.qty}`)
    .join(', ');
  const folio = parts.folio ? ` Pedido ${parts.folio}.` : '';
  const total = parts.total ? ` Total: ${parts.total}.` : '';
  return `Hola NOMAHOME, quiero confirmar mi pedido.${folio} Piezas: ${lines}.${total}`;
}
