export type RouteLike = {
  readonly method?: string;
  readonly path?: string;
};

export function routeContext(route: RouteLike): string {
  const method = route.method ? String(route.method).toUpperCase() : "UNKNOWN";
  const path = route.path ? String(route.path) : "UNKNOWN";
  return `${method} ${path}`;
}
