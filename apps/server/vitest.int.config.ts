import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/**/*.int.test.ts",
      "src/**/test/**/*.int.test.ts",
    ],
    globalSetup: ["./src/test/db/global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage/int",
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
      "generated": resolve(rootDir, "generated"),
    },
  },
});
