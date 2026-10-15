/**
 * Recorte de materia para la franja de categorías (§8 inicio): las
 * categorías no son iconos — son muestras de material dibujadas con la
 * paleta del sistema. Composición geométrica distinta por oficio.
 */
export default function MateriaClip({ slug }: { slug: string }) {
  const common = 'block w-full aspect-[3/2] rounded-[var(--radius-m)]';

  switch (slug) {
    case 'muebles':
      // Veta de madera: líneas horizontales en tonos de roble.
      return (
        <svg viewBox="0 0 300 200" className={common} role="img" aria-label="Madera de taller">
          <rect width="300" height="200" fill="#a98d6b" />
          <g stroke="#5b4432" strokeWidth="2" fill="none" opacity="0.7">
            <path d="M0 40 q80 -12 150 0 t150 0" />
            <path d="M0 80 q100 -10 150 0 t150 -4" />
            <path d="M0 120 q60 -8 150 2 t150 -6" />
            <path d="M0 160 q90 -12 150 0 t150 2" />
          </g>
          <circle cx="250" cy="60" r="10" fill="#5b4432" opacity="0.5" />
          <circle cx="40" cy="150" r="6" fill="#5b4432" opacity="0.4" />
        </svg>
      );

    case 'iluminacion':
      // Luz: abanico de filetes de latón sobre tinta.
      return (
        <svg viewBox="0 0 300 200" className={common} role="img" aria-label="Luz cálida">
          <rect width="300" height="200" fill="#1c1712" />
          <g stroke="#c4a27a" strokeWidth="3" fill="none">
            <path d="M150 170 L150 40" />
            <path d="M150 60 q-40 20 -55 55" opacity="0.8" />
            <path d="M150 60 q40 20 55 55" opacity="0.8" />
            <path d="M150 46 q-20 10 -28 28" opacity="0.5" />
            <path d="M150 46 q20 10 28 28" opacity="0.5" />
          </g>
          <circle cx="150" cy="172" r="14" fill="#c4a27a" />
        </svg>
      );

    case 'tecnologia-del-hogar':
      // Tecnología encubierta: puntos y filetes sobre grafito.
      return (
        <svg viewBox="0 0 300 200" className={common} role="img" aria-label="Tecnología del hogar">
          <rect width="300" height="200" fill="#3a3733" />
          <g stroke="#d8cfc2" strokeWidth="2" fill="none" opacity="0.85">
            <path d="M40 160 h60 v-40 h50 v-40 h60" />
            <path d="M40 60 h40 v30 h70" opacity="0.5" />
          </g>
          <g fill="#c4a27a">
            <circle cx="210" cy="80" r="7" />
            <circle cx="230" cy="120" r="4" />
            <circle cx="190" cy="40" r="4" />
          </g>
        </svg>
      );

    case 'textiles':
      // Textil: trama diagonal en arcilla sobre piedra.
      return (
        <svg viewBox="0 0 300 200" className={common} role="img" aria-label="Textil de asiento">
          <rect width="300" height="200" fill="#d8cfc2" />
          <g stroke="#9c4630" strokeWidth="4" opacity="0.75">
            {Array.from({ length: 12 }, (_, i) => (
              <line key={i} x1={-40 + i * 34} y1="0" x2={-40 + i * 34 + 60} y2="200" />
            ))}
          </g>
          <rect x="0" y="150" width="300" height="50" fill="#9c4630" opacity="0.25" />
        </svg>
      );

    default:
      return <div className={`${common} bg-[var(--stone)]`} />;
  }
}
