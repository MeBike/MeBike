import { serverRoutes } from "@mebike/shared";

type RouteWithPath = {
  path: string;
  getRoutingPath?: () => string;
};

type RouteParams = Record<string, string | number | boolean>;

export const ServerRoutes = serverRoutes;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function interpolateRoutePath(path: string, params?: RouteParams): string {
  if (!params) {
    return path;
  }

  return Object.entries(params).reduce((currentPath, [key, value]) => {
    const normalizedValue = String(value);
    const tokenPattern = new RegExp(`\\{${escapeRegExp(key)}\\}`, "g");
    const routingPattern = new RegExp(`:${escapeRegExp(key)}(?=/|$)`, "g");

    return currentPath
      .replace(tokenPattern, normalizedValue)
      .replace(routingPattern, normalizedValue);
  }, path);
}

export function routePath(routeOrPath: RouteWithPath | string, params?: RouteParams): string {
  const path = typeof routeOrPath === "string"
    ? routeOrPath
    : routeOrPath.getRoutingPath
      ? routeOrPath.getRoutingPath()
      : routeOrPath.path;

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return interpolateRoutePath(normalizedPath, params);
}
