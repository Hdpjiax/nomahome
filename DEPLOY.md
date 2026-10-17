# DEPLOY — NOMAHOME

1. **Vercel**: importa el repo en vercel.com/new (detecta Next.js solo); agrega las variables de `.env.example` en Project → Settings → Environment Variables. La integración de GitHub queda instalada con ese import: cada push a `main` hace deploy, cada PR abre preview.
2. **Supabase**: crea el proyecto en supabase.com, corre `npx supabase link --project-ref <ref>`, `npx supabase db push` (aplica las 3 migraciones) y `npx supabase gen types typescript > lib/supabase/database.types.ts`; activa "Promote to production" solo tras revisar el preview.
3. **GitHub**: el repo es **github.com/Hdpjiax/nomahome** (público). Ya corriendo y verificado en verde: CI (typecheck/lint/tests/build/gitleaks v3 + Playwright contra Supabase local), CodeQL, Dependabot y secret scanning (verificado vía API de alertas). Solo falta un clic: Settings → Code security → activar **Push protection**.
4. **Primer admin**: en Supabase → Authentication → Users crea tu cuenta, y en SQL editor: `update public.profiles set role = 'admin' where id = '<tu-uuid>';` — sin eso nadie ve `/admin`.
5. **Secretos de cobro y factura**: pon `NEXT_PUBLIC_STORE_CLABE` (la CLABE del taller que verán los compradores) y `FACTURAPI_KEY` (llave de servidor de facturapi.io). Con `PAYMENTS_MODE=production` la simulación de pagos queda deshabilitada por completo.

Local: `npx supabase start && npm run dev`. El seed (12 piezas, SVGs propios) se aplica con `npx supabase db reset`.
