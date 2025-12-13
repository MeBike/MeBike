import { bikesRoutes } from "./bikes";
import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";

export * from "./bikes";
export * from "./rentals";
export * from "./reservations";
export * from "./stations";

export const serverRoutes = {
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stations: stationsRoutes,
  bikes: bikesRoutes,
} as const;

export type ServerRouteKey = keyof typeof serverRoutes;
