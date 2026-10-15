import type { Metadata } from 'next';
import LegalBody from '@/components/store/LegalBody';

export const metadata: Metadata = {
  title: 'Devoluciones — NOMAHOME',
  description: 'Devolución de 7 días en piezas sin uso y qué pasa con las piezas por encargo.',
  alternates: { canonical: '/devoluciones' },
};

export default function DevolucionesPage() {
  return (
    <LegalBody
      kicker="Devoluciones"
      title="Siete días para cambiar de opinión."
      lede="Una pieza de taller no se compra igual que un teléfono. Estas son las reglas, en corto."
      sections={[
        {
          heading: 'Piezas de catálogo',
          children: (
            <>
              <p>
                Tienes <strong>7 días naturales</strong> desde la entrega para
                devolver una pieza de catálogo sin uso: sin manchas, sin
                arañones, con sus etiquetas y su empaque original.
              </p>
              <p>
                El reembolso va por el mismo medio de pago, menos el costo de
                recolección. Si la pieza llegó dañada o no es lo que pediste,
                la recolección corre por nosotros.
              </p>
            </>
          ),
        },
        {
          heading: 'Piezas por encargo',
          children: (
            <>
              <p>
                Sofás, mesas y estantería fabricados para ti en color o medida
                especial no tienen devolución, salvo defecto de taller o daño de
                transporte. Antes de cortar la madera te mandamos el plano y la
                muestra de tela: esa es la parte donde se puede cambiar de
                opinión.
              </p>
              <p>
                Si el defecto es del taller, lo reparamos en tu casa o en el
                taller, tú eliges, sin costo y sin discusión.
              </p>
            </>
          ),
        },
        {
          heading: 'Cómo se inicia',
          children: (
            <>
              <p>
                Escríbenos por WhatsApp con tu folio de pedido y una foto de la
                pieza. Te confirmamos la devolución el mismo día de taller y
                agendamos la recolección en 2–4 días hábiles.
              </p>
              <p>
                El reembolso se ve en tu cuenta en 3–5 días hábiles después de
                revisar la pieza.
              </p>
            </>
          ),
        },
        {
          heading: 'Tecnología del hogar',
          children: (
            <>
              <p>
                Bocinas, barras y purificadores se devuelven en los mismos 7
                días si van completos: caja, accesorios y registro de garantía
                sin activar.
              </p>
              <p>
                El desgaste de prueba normal — polvo en el filtro, algunas
                horas de uso — no cuenta como uso si la pieza viene completa.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
