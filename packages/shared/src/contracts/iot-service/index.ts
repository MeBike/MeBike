export * from "./errors";
export * from "./routes";
export * from "./schemas";

export const iotServiceOpenApi = {
  info: {
    title: "IoT Service API",
    version: "1.0.0",
    description: "HTTP contract for publishing IoT commands and querying device state.",
  },
  openapi: "3.1.0",
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
};
