import process from "node:process";
import { Client } from "pg";
import { uuidv7 } from "uuidv7";
import { inject } from "vitest";

import { migrate } from "./migrate";
import { startPostgres } from "./postgres";

function wrapWithTestDatabaseEnv(container: { stop: () => Promise<void>; url: string }) {
  const previousTestDatabaseUrl = process.env.TEST_DATABASE_URL;
  process.env.TEST_DATABASE_URL = container.url;

  return {
    url: container.url,
    stop: async () => {
      if (previousTestDatabaseUrl) {
        process.env.TEST_DATABASE_URL = previousTestDatabaseUrl;
      }
      else {
        delete process.env.TEST_DATABASE_URL;
      }

      await container.stop();
    },
  };
}

export async function getTestDatabase() {
  const templateUrl = inject("testDatabaseUrl");

  if (!templateUrl) {
    const container = await startPostgres();
    await migrate(container.url);
    return wrapWithTestDatabaseEnv(container);
  }

  const urlObj = new URL(templateUrl);
  const templateDbName = urlObj.pathname.slice(1);
  const adminUrl = new URL(templateUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  const newDbName = `test_${uuidv7().replaceAll("-", "")}`;

  try {
    await client.query(`CREATE DATABASE "${newDbName}" TEMPLATE "${templateDbName}"`);
  }
  catch (error) {
    console.error("Failed to clone test database:", error);
    await client.end();
    throw error;
  }
  finally {
    await client.end();
  }

  const testDbUrl = new URL(templateUrl);
  testDbUrl.pathname = `/${newDbName}`;

  return wrapWithTestDatabaseEnv({
    url: testDbUrl.toString(),
    stop: async () => {
      const dropClient = new Client({ connectionString: adminUrl.toString() });
      await dropClient.connect();
      try {
        await dropClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = '${newDbName}' AND pid <> pg_backend_pid();
        `);
        await dropClient.query(`DROP DATABASE IF EXISTS "${newDbName}"`);
      }
      catch (error) {
        console.warn(`Failed to drop test database ${newDbName}:`, error);
      }
      finally {
        await dropClient.end();
      }
    },
  });
}
