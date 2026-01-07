import type { TestProject } from "vitest/node";

import { migrate } from "./migrate";
import { startPostgres } from "./postgres";

export default async function setup(project: TestProject) {
  const container = await startPostgres();
  await migrate(container.url);

  project.provide("testDatabaseUrl", container.url);

  return async () => {
    await container.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}
