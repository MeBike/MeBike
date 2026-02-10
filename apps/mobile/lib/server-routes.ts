import { serverRoutes } from "@mebike/shared";

type RouteWithPath = {
  path: string;
  getRoutingPath?: () => string;
};

export const ServerRoutes = serverRoutes;

export function routePath(routeOrPath: RouteWithPath | string): string {
  const path = typeof routeOrPath === "string"
    ? routeOrPath
    : routeOrPath.getRoutingPath
      ? routeOrPath.getRoutingPath()
      : routeOrPath.path;
  return path.startsWith("/") ? path.slice(1) : path;
}
