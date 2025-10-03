import createConfig from "@mebike/eslint-config/create-config";

export default createConfig({
  ignores: [
    "src/db/migrations/*",
    "public/*",
    "**/*.md",
    "docs/**",
  ],
  rules: {
    "style/arrow-parens": "off",
    "unicorn/throw-new-error": "off",
    "new-cap": "off",
    "no-console": "warn",
  },
  stylistic: {
    quotes: "double",
    semi: true,
  },
});
