import { execSync } from "node:child_process";
import process from "node:process";

export async function migrate(databaseUrl: string) {
  try {
    execSync("pnpm prisma migrate deploy", {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: "inherit",
    });
  }
  catch (error) {
    console.error("Failed to run migrations:", error);
    throw error;
  }
}
