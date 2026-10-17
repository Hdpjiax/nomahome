'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Entrada de página (§5 Motion): fade 420 ms y 12 px de desplazamiento,
 * ease --ease, sin bounce. Con prefers-reduced-motion la transición dura
 * 0 ms: opacidad instantánea.
 *
 * SIEMPRE es motion.div — con o sin reduce —: cambiar el tipo de elemento
 * entre servidor (sin matchMedia, reduce siempre false) y cliente con
 * reduce altera la forma del árbol, corriendo los useId internos y rompiendo
 * la hidratación (p. ej. los ids de pestañas en la ficha).
 */
export default function PageFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
