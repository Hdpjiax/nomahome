'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleProductPublishedAction } from '@/lib/admin/actions';

/** Publicar / sacar de vitrina desde la tabla densa. */
export default function PublishToggle({
  productId,
  published,
}: {
  productId: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={published}
      onClick={() =>
        startTransition(async () => {
          await toggleProductPublishedAction(productId, !published);
          router.refresh();
        })
      }
      className={`font-mono text-[11px] uppercase tracking-[0.08em] border rounded-[var(--radius-s)] px-[var(--space-2)] py-[2px] transition-colors ${
        published
          ? 'border-[var(--ok)] text-[var(--ok)] hover:bg-[var(--ok)] hover:text-[var(--paper)]'
          : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink)]'
      }`}
    >
      {pending ? '…' : published ? 'En vitrina' : 'Oculta'}
    </button>
  );
}
