import process from "node:process";

import { Effect } from "effect";

import {
  makeEnvironmentImpactRepairRepository,
  repairMissingEnvironmentImpactJobs,
} from "@/domain/environment";
import logger from "@/lib/logger";
import { makePrismaClient } from "@/lib/prisma";

const DEFAULT_LIMIT = 100;

type RepairCommandOptions = {
  limit: number;
  completedFrom?: Date;
  completedTo?: Date;
};

function readArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inlineValue = process.argv.find(arg => arg.startsWith(prefix));
  if (inlineValue) {
    return inlineValue.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function parseLimit(value: string | undefined): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error(`Invalid repair limit: ${value}`);
  }

  return limit;
}

function parseDateOption(
  name: string,
  value: string | undefined,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${name}: ${value}`);
  }

  return date;
}

function parseOptions(): RepairCommandOptions {
  const limit = parseLimit(
    readArgValue("limit") ?? process.env.ENVIRONMENT_REPAIR_LIMIT,
  );
  const completedFrom = parseDateOption(
    "completedFrom",
    readArgValue("completedFrom")
      ?? process.env.ENVIRONMENT_REPAIR_COMPLETED_FROM,
  );
  const completedTo = parseDateOption(
    "completedTo",
    readArgValue("completedTo")
      ?? process.env.ENVIRONMENT_REPAIR_COMPLETED_TO,
  );

  if (completedFrom && completedTo && completedFrom > completedTo) {
    throw new Error("completedFrom must be before or equal to completedTo");
  }

  return {
    limit,
    completedFrom,
    completedTo,
  };
}

async function main() {
  const options = parseOptions();
  const prisma = makePrismaClient();

  try {
    await prisma.$connect();
    const repo = makeEnvironmentImpactRepairRepository(prisma);

    logger.info(
      {
        limit: options.limit,
        completedFrom: options.completedFrom?.toISOString(),
        completedTo: options.completedTo?.toISOString(),
      },
      "repair-environment-impact-jobs started",
    );

    const summary = await Effect.runPromise(
      repairMissingEnvironmentImpactJobs(prisma, repo, options),
    );

    logger.info(
      {
        ...summary,
        limit: options.limit,
        completedFrom: options.completedFrom?.toISOString(),
        completedTo: options.completedTo?.toISOString(),
      },
      "repair-environment-impact-jobs completed",
    );
  }
  finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  logger.error({ err }, "repair-environment-impact-jobs failed");
  process.exit(1);
});
