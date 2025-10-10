import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@mebike/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@mebike/shared/(.*)$": "<rootDir>/../../packages/shared/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      tsconfig: "<rootDir>/tsconfig.test.json",
      useESM: true,
      diagnostics: false,
    }],
  },
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@scalar/hono-api-reference)/)",
  ],
};

export default config;
