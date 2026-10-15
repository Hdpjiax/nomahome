import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import HomeBlocksManager from './HomeBlocksManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Inicio · Taller', robots: { index: false } };

export default async function AdminHomePage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('homepage_blocks')
    .select('id, kind, title, body, published, sort_order')
    .order('sort_order');

  return (
    <HomeBlocksManager
      blocks={(data ?? []).map((b) => ({
        id: b.id,
        kind: b.kind,
        title: b.title,
        body: b.body,
        published: b.published,
      }))}
    />
  );
}
