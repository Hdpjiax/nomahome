import { execSync } from 'node:child_process';

/**
 * global-setup de E2E: el stack local de Supabase se resetea a migraciones
 * + seed antes de cada corrida. Así las pruebas son deterministas: el
 * stock, las reseñas y las cuentas de corridas previas no interfieren.
 *
 * Requiere `npx supabase start` corriendo (el dev server lo usa también).
 */
export default function globalSetup() {
  if (process.env.CI) {
    console.log('CI: se espera que el stack de Supabase ya esté levantado.');
    return;
  }
  console.log('Reseteando el stack local de Supabase (migraciones + seed)…');
  execSync('npx supabase db reset', { stdio: 'inherit' });
}
