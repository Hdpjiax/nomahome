'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  catalogNumber?: string;
  children: ReactNode;
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

/**
 * Sheet de Lumen Editorial (§5): en escritorio entra desde la derecha con
 * fondo tinta al 28%; en móvil desde abajo con 92dvh. Duración 420 ms,
 * ease --ease, sin bounce. Reduced motion: opacidad instantánea.
 */
export default function Sheet({ open, onClose, title, catalogNumber, children }: SheetProps) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const duration = reduce ? 0 : 0.42;
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 w-full h-full bg-[var(--ink)] cursor-default"
            style={{ opacity: 0.28 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: reduce ? 0.28 : 0.28 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            onClick={onClose}
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute bg-[var(--paper)] shadow-[var(--shadow)] flex flex-col ${
              isMobile
                ? 'left-0 right-0 bottom-0 rounded-t-[var(--radius-m)] max-h-[92dvh]'
                : 'top-0 right-0 bottom-0 w-full max-w-md rounded-l-[var(--radius-m)]'
            }`}
            initial={
              reduce
                ? { opacity: 0 }
                : isMobile
                  ? { y: '100%' }
                  : { x: '100%' }
            }
            animate={reduce ? { opacity: 1 } : { x: 0, y: 0 }}
            exit={reduce ? { opacity: 0 } : isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ duration, ease }}
          >
            <header className="flex items-start justify-between gap-[var(--space-4)] px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--line)]">
              <div>
                {catalogNumber ? <p className="text-catalog mb-1">{catalogNumber}</p> : null}
                <h2 className="font-display text-xl leading-tight">{title}</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="font-mono text-sm border border-[var(--line)] rounded-[var(--radius-s)] px-[var(--space-2)] py-1 hover:border-[var(--ink)]"
              >
                Cerrar
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-[var(--space-5)] py-[var(--space-4)]">
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
