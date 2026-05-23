import { systemConfigsCommands } from "./commands";
import { systemConfigsQueries } from "./queries";

export * from "./commands";
export * from "./queries";
export * from "./shared";

export const systemConfigsRoutes = {
  ...systemConfigsCommands,
  ...systemConfigsQueries,
} as const;
