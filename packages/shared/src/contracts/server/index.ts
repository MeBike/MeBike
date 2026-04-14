export * as AgenciesContracts from "./agencies";
export * from "./agencies";
export * as AgencyRequestsContracts from "./agency-requests";
export * from "./agency-requests";
export * as AuthContracts from "./auth";
export * as BikesContracts from "./bikes";
export * as FixedSlotTemplatesContracts from "./fixed-slots";
export * from "./fixed-slots";
export * as IncidentsContracts from "./incidents";
export * as JobsContracts from "./jobs";
export * from "./jobs";
export * as RatingsContracts from "./ratings";
export * as RedistributionContracts from "./redistribution";
export * as RentalsContracts from "./rentals";
export * from "./rentals";
export * as ReservationsContracts from "./reservations";
export * from "./reservations";
export * from "./routes";
export * from "./schemas";
export * as StationsContracts from "./stations";
export * as StatsContracts from "./stats";
export * as StripeContracts from "./stripe";
export * as SubscriptionsContracts from "./subscriptions";
export * as SuppliersContracts from "./suppliers";
export * as UsersContracts from "./users";
export * as WalletsContracts from "./wallets";

export const serverOpenApi = {
  info: {
    title: "Server API",
    version: "1.0.0",
    description: "HTTP contract for the main backend (stations, rentals, reservations, etc.).",
  },
  openapi: "3.1.0",
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};
