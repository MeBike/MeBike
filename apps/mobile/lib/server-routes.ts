import { ServerContracts } from "@mebike/shared";

export const ServerRoutes = ServerContracts.serverRoutes;

export function routePath(route: { getRoutingPath: () => string }): string {
  const path = route.getRoutingPath();
  return path.startsWith("/") ? path.slice(1) : path;
}
