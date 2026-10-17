# Casa Lumen / NOMAHOME — Rules & Skills (Luxury Edition)

## Hard Rules

**No exceptions:**

- Never mark `orders.status = paid` from client, WhatsApp, or without valid webhook signature.
- Never put `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_` on secrets.
- Never disable RLS, use service role in client components, or trust roles in localStorage only.
- No `any`, `@ts-ignore`, prices calculated only in browser.
- No Inter, Roboto, Geist, Arial, zinc cards, purple gradients, particle heroes, icon systems, or shadcn/ui defaults.
- All product variants pair verified high-resolution editorial photography (`lib/catalog/photo-registry.ts`) with local architectural studio renders (`public/brand/photos/*.jpg` and `public/brand/seed/*.svg`) via `<LuxuryImage>`.
- Keep all border radii `<= 6px` (`--radius-s: 2px`, `--radius-m: 6px`) and preserve left-aligned Fraunces `h1` headings and 64px fixed header.
- No made-up endpoints. Payment and CFDI follow official docs.

## Skills

Use these when working on their domains:

- [`diseno-original`](.agents/skills/diseno-original/SKILL.md) — UI, layout, motion, design system, home, product card, cart, admin
- [`catalogo-producto`](.agents/skills/catalogo-producto/SKILL.md) — Products, variants, colors, photos, categories, quick add, search, reviews
- [`checkout`](.claude/skills/checkout/SKILL.md) — Carrito, checkout, cobro por SPEI, confirmación de pagos, webhooks, estados de pedido, ledger
- [`facturacion-cfdi`](.agents/skills/facturacion-cfdi/SKILL.md) — Billing, CFDI 4.0, Facturapi, invoices
- [`admin-catalogo`](.agents/skills/admin-catalogo/SKILL.md) — Admin panel, products, photos, categories, orders, payments, invoices, reviews
- [`auditoria-seguridad`](.agents/skills/auditoria-seguridad/SKILL.md) — Typecheck, lint, tests, build, secrets, RLS, webhooks, headers, Lighthouse, axe

## Stack

- **Framework**: Next.js 16+ (App Router, TypeScript strict)
- **Styling**: Tailwind CSS 4 with custom tokens (`Lumen Editorial Luxury`)
- **Backend**: Supabase (Postgres, Auth, Storage, RLS) + seamless local fallback catalog (`lib/catalog/fallback-catalog.ts`)
- **Payment**: Own SPEI checkout (incoming bank transfer to the workshop CLABE, no card capture on server)
- **Invoicing**: Facturapi CFDI 4.0 (no fake PDFs)
- **Deploy**: Vercel + Supabase
