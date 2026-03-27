import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreFiles: [
    "apps/mobile/components/IconSymbol.ios.tsx",
  ],
  workspaces: {
    "apps/mobile": {
      entry: [
        "index.ts",
        "App.tsx",
        "navigation/RootNavigator.tsx",
        "scripts/*.mjs",
        "tamagui.config.ts",
      ],
      project: ["**/*.{ts,tsx}"],
      ignore: ["types/ky.d.ts"],
    },
  },
};

export default config;
