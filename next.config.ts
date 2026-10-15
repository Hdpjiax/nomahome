import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los SVG del seed son piezas dibujadas por el taller, no contenido
    // subido por usuarios. Con sandbox + attachment el navegador jamás
    // los ejecuta como documento.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    // Next en modo dev necesita unsafe-eval para React Refresh; en producción
    // no lo necesita nadie: no hay SDK de terceros, el checkout es nuestro.
    const scriptSrc = isProduction
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      // self + data + Supabase (storage remoto en producción)
      "img-src 'self' data: https://*.supabase.co",
      "font-src 'self' data:",
      "frame-src 'self'",
      isProduction
        ? "connect-src 'self' https://*.supabase.co"
        : "connect-src 'self' https://*.supabase.co http://127.0.0.1:54321 http://localhost:54321",
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp.join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

