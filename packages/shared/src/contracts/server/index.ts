export * as BikesContracts from "./bikes";
export * from "./rentals";
export * from "./routes";
export * from "./schemas";
export * as StationsContracts from "./stations";

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
