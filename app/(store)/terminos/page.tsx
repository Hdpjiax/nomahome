import type { Metadata } from 'next';
import LegalBody from '@/components/store/LegalBody';

export const metadata: Metadata = {
  title: 'Términos — NOMAHOME',
  description: 'Condiciones de compra: precios con IVA, piezas por encargo, garantía de taller.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalBody
      kicker="Términos"
      title="Las reglas de la compra, dichas en corto."
      lede="Precios, encargos, garantía y qué ley nos rige. Si algo no queda claro, pregúntale al taller antes de comprar: para eso está el WhatsApp."
      sections={[
        {
          heading: 'Precios y pagos',
          children: (
            <>
              <p>
                Todos los precios están en pesos mexicanos con IVA incluido.
                Validamos el pedido con el precio vigente al confirmarlo; si
                una pieza cambia de precio después, te lo avisamos antes de
                fabricar.
              </p>
              <p>
                El pedido se confirma con el pago por transferencia SPEI a la
                cuenta del taller. La pieza se reserva cuando el pago se ve en
                la cuenta del banco, y el pedido pasa a pagado en el momento en
                que el taller lo confirma.
              </p>
            </>
          ),
        },
        {
          heading: 'Piezas por encargo',
          children: (
            <>
              <p>
                Al encargar una pieza en color o medida especial apruebas el
                plano y la muestra de material que te enviamos. Con el plano
                aprobado, el pedido no se cancela: la madera ya está cortada
                para tu casa.
              </p>
              <p>
                Las medidas publicadas tienen una tolerancia de ±1 cm en
                mueblería: la madera respira.
              </p>
            </>
          ),
        },
        {
          heading: 'Garantía de taller',
          children: (
            <>
              <p>
                Dos años en estructura y electrónica de las piezas del
                catálogo: resortes, espigas, herrajes, bocinas y purificadores.
                La cera y los tejidos se consideran mantenimiento.
              </p>
              <p>
                La garantía cubre defectos de fabricación y no funciona de
                mapa: si nos traes una pieza con 20 años, la vemos igual,
                porque nos interesa cómo envejece.
              </p>
            </>
          ),
        },
        {
          heading: 'Marco legal',
          children: (
            <>
              <p>
                Esta tienda la opera el taller en Morelia, Michoacán, México.
                Las ventas se rigen por la Ley Federal de Protección al
                Consumidor y la facturación por el CFDI 4.0 del SAT.
              </p>
              <p>
                Para cualquier desacuerdo, primero la palabra: WhatsApp, correo
                o el taller en Morelia. Si no nos ponemos de acuerdo, te toca
                PROFECO y te asistimos con la documentación.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
