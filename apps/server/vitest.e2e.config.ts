import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/http/test/e2e/**/*.int.test.ts"],
    globalSetup: ["./src/test/db/global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/e2e",
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      generated: resolve(rootDir, "generated"),
    },
  },
});
