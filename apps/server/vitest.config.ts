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
      "examples/**/*.{test,spec}.ts",
      "src/**/test/**/*.{test,spec}.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
    },
    exclude: ["**/*.int.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      "generated": resolve(rootDir, "generated"),
    },
  },
});
