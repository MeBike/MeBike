import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/**/*.{test,spec,int.test}.ts",
      "src/**/test/**/*.{test,spec}.ts",
      "src/**/test/**/*.int.test.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      "generated": resolve(rootDir, "generated"),
    },
  },
});
