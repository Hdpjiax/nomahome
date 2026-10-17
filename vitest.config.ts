import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// El alias @ de tsconfig, resuelto desde la raíz del repo (tests/unit/
// importa los módulos de lib/ como @/lib/...).
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    // Los specs de Playwright corren con `npm run test:e2e`, no aquí.
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
