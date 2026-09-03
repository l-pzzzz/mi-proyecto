import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// Vitest corre como un proceso de Node aparte de Next, asi que no hereda la
// carga automatica de .env.local que hace `next dev`. loadEnv() replica esa
// misma convencion de archivos (.env, .env.local, etc.) para que los tests
// tengan las mismas variables que la app real. El "" como tercer argumento le
// dice que cargue TODAS las variables, no solo las prefijadas VITE_.
const env = loadEnv("", process.cwd(), "");
Object.assign(process.env, env);

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