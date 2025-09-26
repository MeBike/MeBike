import createConfig from "@mebike/eslint-config/create-config";

export default createConfig({
  ignores: ["src/db/migrations/*", "public/*"],
  rules: {
    "style/arrow-parens": "off",
    "unicorn/throw-new-error": "off",
    "new-cap": "off",
  },
  stylistic: {
    quotes: "double",
    semi: true,
  },
});
