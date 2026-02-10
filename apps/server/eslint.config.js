import createConfig from "@mebike/eslint-config/create-config";

export default createConfig({
  ignores: [
    "dist/**",
    "dist-test/**",
    "generated/**",
    "AGENTS.md",
    "prisma/migrations/migration_lock.toml",
  ],
  rules: {
    "no-console": "warn",
  },
  stylistic: {
    quotes: "double",
    semi: true,
  },
});
