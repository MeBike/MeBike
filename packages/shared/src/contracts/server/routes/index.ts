import { authRoutes } from "./auth";
import { bikesRoutes } from "./bikes";
import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";
import { suppliersRoutes } from "./suppliers";
import { usersRoutes } from "./users";

export * from "./auth";
export * from "./bikes";
export * from "./rentals";
export * from "./reservations";
export * from "./stations";
export * from "./suppliers";
export * from "./users";

export const serverRoutes = {
  auth: authRoutes,
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stations: stationsRoutes,
  bikes: bikesRoutes,
  suppliers: suppliersRoutes,
  users: usersRoutes,
} as const;

export type ServerRouteKey = keyof typeof serverRoutes;
