import antfu from "@antfu/eslint-config";

export default function createConfig(options, ...userConfigs) {
  return antfu(
    {
      type: "app",
      typescript: true,
      formatters: true,
      ignores: [
        "**/dist/**",
        "**/build/**",
        "**/docs/**",
        "**/*.md",
        "**/node_modules/**",
        "**/apps/backend/**",
      ],
      stylistic: {
        indent: 2,
        semi: true,
        quotes: "backtick",
      },
      ...options,
    },
    {
      rules: {
        "style/quotes": ["error", "double"],
        "style/eol-last": "error",
        "ts/consistent-type-definitions": ["error", "type"],
        "no-console": ["warn"],
        "antfu/no-top-level-await": ["off"],
        // "node/no-process-env": ["error"],
        "perfectionist/sort-imports": [
          "error",
          {
            tsconfigRootDir: ".",
          },
        ],
        "unicorn/filename-case": [
          "error",
          {
            case: "kebabCase",
            ignore: ["README.md"],
          },
        ],
      },
    },
    ...userConfigs,
    {
      // Chỉ áp dụng cho các file declaration (.d.ts)
      files: ["**/*.d.ts"],
      // Trong các file này, hãy tắt quy tắc đó đi
      rules: {
        "ts/consistent-type-definitions": "off",
      },
    },
  );
}
