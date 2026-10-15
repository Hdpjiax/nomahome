---
name: diseno-original
description: Usar al crear o modificar cualquier UI de Casa Lumen, layout, motion, tokens, home, ficha, carrito o admin. Obliga el sistema Lumen Editorial y prohíbe looks de template.
---

# Diseño original

1. Lee `app/styles/tokens.css` antes de crear un componente.
2. Usa solo `--ink`, `--paper`, `--stone`, `--brass`, `--clay`, `--pine` y las fuentes Fraunces, Schibsted Grotesk e IBM Plex Mono.
3. Compón en asimetría. Una pieza grande, texto al lado, filete de 1px `--line`.
4. Motion solo con `motion/react`, duraciones `--fast`, `--base`, `--slow`, ease `--ease`.
5. Implementa `prefers-reduced-motion`.
6. No importes un theme kit. Si un componente nace pareciendo shadcn, bórralo y redibújalo.
7. Admin usa la misma materia visual, con densidad mayor y mono para datos. No es un panel gris de Bootstrap.
8. Antes de cerrar una pantalla, compárala con la lista de anti-patrones de INSTRUCCION.md.
