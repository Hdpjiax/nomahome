import type { Metadata } from 'next';
import LegalBody from '@/components/store/LegalBody';

export const metadata: Metadata = {
  title: 'Privacidad — NOMAHOME',
  description: 'Qué datos pedimos, cómo se guardan y qué no pedimos jamás (tarjetas).',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalBody
      kicker="Privacidad"
      title="Pedimos lo mínimo y lo cuidamos como el buen mueble."
      lede="Esto es lo que recolectamos al comprar en NOMAHOME y para qué sirve. Escrito por el taller, no por un despacho."
      sections={[
        {
          heading: 'Lo que pedimos',
          children: (
            <>
              <p>
                Para comprar: tu nombre, tu correo, tu teléfono y la dirección
                de entrega. Si pides factura: tus datos fiscales (RFC, régimen,
                uso de CFDI y código postal).
              </p>
              <p>
                El correo sirve para el recibo del pedido y el estado del
                envío. El teléfono, para coordinar la entrega con una persona,
                no una máquina.
              </p>
            </>
          ),
        },
        {
          heading: 'Lo que no pedimos jamás',
          children: (
            <>
              <p>
                <strong>Nunca te pedimos número de tarjeta ni código de seguridad.</strong>{' '}
                El cobro se hace por transferencia SPEI desde tu banco a la
                cuenta del taller: los datos de tu tarjeta nunca tocan este
                sitio.
              </p>
              <p>
                Tampoco pedimos datos de recién nacidos, ni ubicación
                permanente, ni acceso a tus contactos.
              </p>
            </>
          ),
        },
        {
          heading: 'Cómo se guarda',
          children: (
            <>
              <p>
                Tu cuenta y tus pedidos viven en Supabase (Postgres), con
                acceso restringido por rol: nadie más que tú y el taller puede
                leer tus pedidos, ni siquiera otros clientes.
              </p>
              <p>
                Los mensajes del formulario de contacto se guardan con la misma
                protección y solo el taller los lee.
              </p>
            </>
          ),
        },
        {
          heading: 'Tus derechos',
          children: (
            <>
              <p>
                Puedes pedirnos una copia, corrección o borrado de tus datos
                escribiendo a{' '}
                <a
                  href="mailto:hola@nomahome.us"
                  className="underline underline-offset-4 decoration-[var(--brass)]"
                >
                  hola@nomahome.us
                </a>
                . Contestamos en 5 días hábiles.
              </p>
              <p>
                No vendemos, rentamos ni regalamos tu información. El único uso
                de tus datos es tu pedido y, si aceptas, el aviso de piezas
                nuevas del taller.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
