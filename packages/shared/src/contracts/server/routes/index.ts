import { authRoutes } from "./auth";
import { bikesRoutes } from "./bikes";
import { ratingsRoutes } from "./ratings";
import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";
import { subscriptionsRoutes } from "./subscriptions";
import { suppliersRoutes } from "./suppliers";
import { usersRoutes } from "./users";
import { walletsRoutes } from "./wallets";

export * from "./auth";
export * from "./bikes";
export * from "./ratings";
export * from "./rentals";
export * from "./reservations";
export * from "./stations";
export * from "./subscriptions";
export * from "./suppliers";
export * from "./users";
export * from "./wallets";

export const serverRoutes = {
  auth: authRoutes,
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stations: stationsRoutes,
  bikes: bikesRoutes,
  suppliers: suppliersRoutes,
  subscriptions: subscriptionsRoutes,
  users: usersRoutes,
  ratings: ratingsRoutes,
  wallets: walletsRoutes,
} as const;

export type ServerRouteKey = keyof typeof serverRoutes;
