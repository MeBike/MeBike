import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";

export * from "./rentals";
export * from "./reservations";
export * from "./stations";

export const serverRoutes = {
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stations: stationsRoutes,
} as const;

export type ServerRouteKey = keyof typeof serverRoutes;
