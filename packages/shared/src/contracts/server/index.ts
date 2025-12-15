export * as BikesContracts from "./bikes";
export * as RentalsContracts from "./rentals";
export * from "./rentals";
export * from "./routes";
export * from "./schemas";
export * as StationsContracts from "./stations";
export * as SuppliersContracts from "./suppliers";
export * as UsersContracts from "./users";

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
};
