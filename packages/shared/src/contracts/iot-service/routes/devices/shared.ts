import { ErrorResponseSchema } from "../../schemas";

export const deviceErrorResponses = {
  500: {
    description: "Infrastructure or system error occurred.",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        examples: {
          infrastructureError: {
            summary: "System error (production)",
            value: {
              error: "A system error occurred. Please try again later.",
              details: {
                code: "INFRASTRUCTURE_ERROR",
              },
            },
          },
          infrastructureErrorDev: {
            summary: "System error (development)",
            value: {
              error: "A system error occurred. Please try again later.",
              details: {
                code: "INFRASTRUCTURE_ERROR",
                message: "Failed to connect to MQTT broker",
                brokerUrl: "mqtt://localhost:1883",
                originalError: "Connection refused",
              },
            },
          },
        },
      },
    },
  },
} as const;
