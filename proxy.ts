import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware de sesión Supabase (patrón oficial @supabase/ssr (Next 16: convención proxy)):
 * refresca el token en cada request escribiendo las cookies en la
 * respuesta. No autoriza nada aquí: las páginas deciden con getUser()
 * en el servidor; el admin se verifica con profiles.role (fase 7).
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: getUser() valida el token contra el servidor de auth.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Todo excepto estáticos e imágenes propias (SVG del seed, og.png,
     * favicon). El carrito, la sesión y las páginas de tienda pasan por
     * aquí.
     */
    '/((?!_next/static|_next/image|favicon.ico|og\\.png|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
