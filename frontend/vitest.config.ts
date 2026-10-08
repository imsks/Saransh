import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // tsconfig keeps jsx: "preserve" for Next; esbuild needs a real transform for .tsx tests.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
