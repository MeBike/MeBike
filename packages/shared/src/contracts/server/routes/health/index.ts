import { serverHealthRoute } from "./queries";

export * from "./queries";

export const healthRoutes = {
  health: serverHealthRoute,
} as const;
