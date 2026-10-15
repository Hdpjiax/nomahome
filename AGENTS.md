# Casa Lumen — Rules & Skills

## Hard Rules

**No exceptions:**

- Never mark `orders.status = paid` from client, WhatsApp, or without valid webhook signature.
- Never put `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_` on secrets.
- Never disable RLS, use service role in client components, or trust roles in localStorage only.
- No `any`, `@ts-ignore`, prices calculated only in browser.
- No Inter, Roboto, Geist, Arial, zinc cards, purple gradients, particle heroes, icon systems, or shadcn/ui defaults.
- No Unsplash/Pexels/repeat placeholders as final design. Seed uses custom SVG from repo. Admin uploads real photos.
- No made-up endpoints. Payment and CFDI follow official docs.

## Skills

Use these when working on their domains:

- [`diseno-original`](.agents/skills/diseno-original/SKILL.md) — UI, layout, motion, design system, home, product card, cart, admin
- [`catalogo-producto`](.agents/skills/catalogo-producto/SKILL.md) — Products, variants, colors, photos, categories, quick add, search, reviews
- [`checkout`](.agents/skills/checkout/SKILL.md) — Carrito, checkout, cobro por SPEI, confirmación de pagos, webhooks, estados de pedido, ledger
- [`facturacion-cfdi`](.agents/skills/facturacion-cfdi/SKILL.md) — Billing, CFDI 4.0, Facturapi, invoices
- [`admin-catalogo`](.agents/skills/admin-catalogo/SKILL.md) — Admin panel, products, photos, categories, orders, payments, invoices, reviews
- [`auditoria-seguridad`](.agents/skills/auditoria-seguridad/SKILL.md) — Typecheck, lint, tests, build, secrets, RLS, webhooks, headers, Lighthouse, axe

## Stack

- **Framework**: Next.js 16+ (App Router, TypeScript strict)
- **Styling**: Tailwind CSS 4 with custom tokens
- **Backend**: Supabase (Postgres, Auth, Storage, RLS)
- **Payment**: Mercado Pago (Payment Brick, no card capture on server)
- **Invoicing**: Facturapi CFDI 4.0 (no fake PDFs)
- **Deploy**: Vercel + Supabase

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
