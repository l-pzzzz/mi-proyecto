import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    // Si esto pasa de ~60 s en local, el bucle del agente se degrada.
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Sin umbral global a proposito: perseguir cobertura alta produce
      // tests inutiles. Lo que importa es que los caminos criticos esten.
      exclude: ["**/*.config.*", "e2e/**", ".next/**"],
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
