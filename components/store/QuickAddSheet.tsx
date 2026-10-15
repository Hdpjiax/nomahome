'use client';

import { useState } from 'react';
import Sheet from './Sheet';
import QuickAdd from './QuickAdd';
import type { CatalogPiece } from '@/lib/catalog/types';

/**
 * Botón "Agregar" de los listados: abre el sheet con el QuickAdd (§8).
 */
export default function QuickAddSheet({ piece }: { piece: CatalogPiece }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn-secondary text-sm"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Agregar
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={piece.name}
        catalogNumber={piece.sku}
      >
        <QuickAdd piece={piece} onClose={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
