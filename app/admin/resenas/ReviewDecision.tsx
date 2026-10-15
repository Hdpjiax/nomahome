'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReviewAction } from '@/lib/reviews/actions';

/** Publicar o rechazar (§8 admin). Solo admin: verificado en servidor. */
export default function ReviewDecision({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {status !== 'published' ? (
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await moderateReviewAction(reviewId, 'published');
              setMessage(result.message);
              router.refresh();
            })
          }
        >
          Publicar
        </button>
      ) : null}
      {status !== 'rejected' ? (
        <button
          type="button"
          className="btn-secondary text-xs"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await moderateReviewAction(reviewId, 'rejected');
              setMessage(result.message);
              router.refresh();
            })
          }
        >
          Rechazar
        </button>
      ) : null}
      {message ? <span className="text-xs text-[var(--ink-soft)]">{message}</span> : null}
    </div>
  );
}
