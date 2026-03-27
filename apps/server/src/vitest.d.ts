import "vitest";

declare module "vitest" {
  interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

export {};
