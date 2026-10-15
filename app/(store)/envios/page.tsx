import type { Metadata } from 'next';
import LegalBody from '@/components/store/LegalBody';
import { formatMXN, shippingCents } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Envíos — NOMAHOME',
  description: 'Plazos de taller, costos de envío por estado y qué pasa si la pieza llega dañada.',
  alternates: { canonical: '/envios' },
};

export default function EnviosPage() {
  return (
    <LegalBody
      kicker="Envíos y plazos"
      title="Cada pieza sale del taller cuando está lista."
      lede="No vendemos bodega: fabricamos, laqueamos y probamos cada pieza antes de empacarla. Esto es lo que puedes esperar."
      sections={[
        {
          heading: 'Plazos de taller',
          children: (
            <>
              <p>
                Las piezas en existencia salen en 2–4 días hábiles. Las piezas
                por encargo (sofás, mesas, estantería a medida) tardan de una a
                tres semanas según el material. El plazo aparece en tu pedido y
                te avisamos por WhatsApp en cada paso.
              </p>
              <p>
                Si una pieza se retrasa por madera o tela, te ofrecemos
                cambiarla de color o cancelar sin costo.
              </p>
            </>
          ),
        },
        {
          heading: 'Costos',
          children: (
            <>
              <p>
                Dentro de Michoacán: <strong>{formatMXN(shippingCents(100_000, 'Michoacán'))}</strong>.
                Al resto de la república: <strong>{formatMXN(shippingCents(100_000, 'CDMX'))}</strong>.
                Gratis en pedidos mayores a <strong>{formatMXN(1_500_000)}</strong>.
              </p>
              <p>
                Los muebles grandes van con entrega e instalación dentro de
                Michoacán: subimos la pieza, la colocamos y nos llevamos el
                empaque. La cotización de paquetería por pieza especial
                (cristal, mármol) se hace por WhatsApp antes de cobrar.
              </p>
            </>
          ),
        },
        {
          heading: 'Daños en el transporte',
          children: (
            <>
              <p>
                Revisa la pieza antes de firmar de recibido. Si llega con golpe,
                raya o pieza faltante, anótalo en la guía y tómale foto. Tienes
                48 horas para reportarlo por WhatsApp con tu folio.
              </p>
              <p>
                En muebles el taller repara o repone la pieza dañada sin costo.
                El seguro de transporte corre por nosotros: no tienes que
                pelear con la paquetería.
              </p>
            </>
          ),
        },
        {
          heading: 'Cómo llega',
          children: (
            <>
              <p>
                Las piezas van desarmables cuando se puede, con instructivo
                papel — no PDF de diez páginas — y las herramientas que hacen
                falta. Las patas vienen protegidas con fieltro puesto.
              </p>
              <p>
                Entregamos contra firma de una persona adulta. Si nadie está,
                reagendamos sin costo la primera vez.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
