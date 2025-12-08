import createConfig from "@mebike/eslint-config/create-config";

export default createConfig({
  ignores: ["dist/**", "dist-test/**"],
  rules: {
    "no-console": "warn",
  },
  stylistic: {
    quotes: "double",
    semi: true,
  },
});
