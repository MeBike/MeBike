import { agenciesRoutes } from "./agencies";
import { agencyRequestsRoutes } from "./agency-requests";
import { aiRoutes } from "./ai";
import { authRoutes } from "./auth";
import { bikesRoutes } from "./bikes";
import { couponRulesRoutes } from "./coupon-rules";
import { environmentRoutes } from "./environment";
import { fixedSlotTemplatesRoutes } from "./fixed-slots";
import { healthRoutes } from "./health";
import { incidentsRoutes } from "./incidents";
import { operatorsRoutes } from "./operators";
import { ratingsRoutes } from "./ratings";
import { redistributionRoutes } from "./redistribution";
import { rentalsRoutes } from "./rentals";
import { reservationsRoutes } from "./reservations";
import { stationsRoutes } from "./stations";
import { statsRoutes } from "./stats";
import { stripeRoutes } from "./stripe";
import { subscriptionsRoutes } from "./subscriptions";
import { suppliersRoutes } from "./suppliers";
import { technicianTeamsRoutes } from "./technician-teams";
import { usersRoutes } from "./users";
import { walletsRoutes } from "./wallets";

export * from "./agencies";
export * from "./agency-requests";
export * from "./ai";
export * from "./auth";
export * from "./bikes";
export * from "./coupon-rules";
export * from "./environment";
export * from "./fixed-slots";
export * from "./health";
export * from "./incidents";
export * from "./operators";
export * from "./ratings";
export * from "./redistribution";
export * from "./rentals";
export * from "./reservations";
export * from "./stations";
export * from "./stats";
export * from "./stripe";
export * from "./subscriptions";
export * from "./suppliers";
export * from "./technician-teams";
export * from "./users";
export * from "./wallets";

export type ServerRoutes = {
  readonly agencies: typeof agenciesRoutes;
  readonly agencyRequests: typeof agencyRequestsRoutes;
  readonly auth: typeof authRoutes;
  readonly environment: typeof environmentRoutes;
  readonly fixedSlotTemplates: typeof fixedSlotTemplatesRoutes;
  readonly health: typeof healthRoutes;
  readonly rentals: typeof rentalsRoutes;
  readonly reservations: typeof reservationsRoutes;
  readonly stats: typeof statsRoutes;
  readonly stations: typeof stationsRoutes;
  readonly bikes: typeof bikesRoutes;
  readonly couponRules: typeof couponRulesRoutes;
  readonly suppliers: typeof suppliersRoutes;
  readonly subscriptions: typeof subscriptionsRoutes;
  readonly users: typeof usersRoutes;
  readonly ratings: typeof ratingsRoutes;
  readonly wallets: typeof walletsRoutes;
  readonly stripe: typeof stripeRoutes;
  readonly incidents: typeof incidentsRoutes;
  readonly operators: typeof operatorsRoutes;
  readonly redistribution: typeof redistributionRoutes;
  readonly technicianTeams: typeof technicianTeamsRoutes;
};

export const serverRoutes: ServerRoutes = {
  agencies: agenciesRoutes,
  agencyRequests: agencyRequestsRoutes,
  ai: aiRoutes,
  auth: authRoutes,
  environment: environmentRoutes,
  fixedSlotTemplates: fixedSlotTemplatesRoutes,
  health: healthRoutes,
  rentals: rentalsRoutes,
  reservations: reservationsRoutes,
  stats: statsRoutes,
  stations: stationsRoutes,
  bikes: bikesRoutes,
  couponRules: couponRulesRoutes,
  suppliers: suppliersRoutes,
  subscriptions: subscriptionsRoutes,
  users: usersRoutes,
  ratings: ratingsRoutes,
  wallets: walletsRoutes,
  stripe: stripeRoutes,
  incidents: incidentsRoutes,
  operators: operatorsRoutes,
  redistribution: redistributionRoutes,
  technicianTeams: technicianTeamsRoutes,
};

export type ServerRouteKey = keyof typeof serverRoutes;
