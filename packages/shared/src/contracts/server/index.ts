export * as AgenciesContracts from "./agencies";
export * from "./agencies";
export * as AgencyRequestsContracts from "./agency-requests";
export * from "./agency-requests";
export * as AiContracts from "./ai";
export * from "./ai";
export * as AuthContracts from "./auth";
export * as BikesContracts from "./bikes";
export * as CouponsContracts from "./coupons";
export * from "./coupons";
export * as EnvironmentContracts from "./environment";
export * from "./environment";
export * as FixedSlotTemplatesContracts from "./fixed-slots";
export * from "./fixed-slots";
export * as IncidentsContracts from "./incidents";
export * as JobsContracts from "./jobs";
export * from "./jobs";
export * as OperatorsContracts from "./operators";
export * from "./operators";
export * as PricingPoliciesContracts from "./pricing-policies";
export * from "./pricing-policies";
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
export * as TechnicianTeamsContracts from "./technician-teams";
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
