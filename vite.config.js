import { defineConfig } from "vite";

export default defineConfig({
  // mupdf nutzt Top-Level-Await und lädt seine .wasm selbst: nicht vorbündeln.
  optimizeDeps: { exclude: ["mupdf"] },
  build: { target: "esnext" },
  worker: { format: "es" },
  test: {
    include: ["tests/unit/**/*.test.js"],
    testTimeout: 60_000,
  },
});
