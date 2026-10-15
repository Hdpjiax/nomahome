'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { contactSchema, type ContactState } from '@/lib/validators/contact';

/**
 * Rate limit de servidor para el formulario de contacto (§8 contacto):
 * máx. 3 mensajes por hora por IP. En memoria: suficiente para una sola
 * instancia; un store compartido (p. ej. Upstash) es fase posterior.
 */
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, number[]>();

function tooManyRequests(ip: string, now = Date.now()): boolean {
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  buckets.set(ip, hits);
  return hits.length > RATE_LIMIT;
}

export async function submitContact(
  _prev: ContactState | null,
  formData: FormData
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    body: formData.get('body'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'local')
    .split(',')[0]
    .trim();

  if (tooManyRequests(ip)) {
    return {
      ok: false,
      error:
        'Ya nos escribiste varias veces esta hora. Espérate un poco o háblanos por WhatsApp.',
    };
  }

  // Insert directo con la sesión del visitante: RLS permite INSERT anónimo
  // en messages y ninguna policy de lectura. Sin service role.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    body: parsed.data.body,
  });

  if (error) {
    return {
      ok: false,
      error: 'El mensaje no se pudo guardar. Inténtalo en un rato.',
    };
  }

  return { ok: true };
}
