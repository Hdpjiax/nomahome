'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * El único bloque del home que se revela con scroll (§5 Motion):
 * medidas/nota de oficio. Con prefers-reduced-motion la transición dura
 * 0 ms: aparece instantáneo al entrar en vista. Nada de Lenis global.
 *
 * SIEMPRE es motion.section — con o sin reduce —: cambiar el tipo de
 * elemento entre servidor y cliente altera el árbol y los useId internos.
 */
export default function Reveal({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={reduce ? { duration: 0 } : { duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
