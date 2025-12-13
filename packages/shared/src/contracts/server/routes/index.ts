import { bikesRoutes } from "./bikes";
import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";
import { suppliersRoutes } from "./suppliers";

export * from "./bikes";
export * from "./rentals";
export * from "./reservations";
export * from "./stations";
export * from "./suppliers";

export const serverRoutes = {
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stations: stationsRoutes,
  bikes: bikesRoutes,
  suppliers: suppliersRoutes,
} as const;

export type ServerRouteKey = keyof typeof serverRoutes;
