import { ERROR_CODES } from "../../errors";
import {
  CommandAcceptedResponseSchema,
  ErrorResponseSchema,
} from "../../schemas";

export const commandResponses = {
  202: {
    description: "Command accepted for delivery.",
    content: {
      "application/json": {
        schema: CommandAcceptedResponseSchema,
      },
    },
  },
} as const;

export const commandErrorResponses = {
  400: {
    description: "Invalid command payload.",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        examples: {
          validationError: {
            summary: "Payload failed validation",
            value: {
              error: "Invalid command payload",
              details: {
                code: "VALIDATION_ERROR",
                issues: [
                  {
                    path: "command",
                    message: "Invalid option: expected one of \"book\"|\"claim\"|\"release\"",
                    code: "invalid_enum_value",
                    received: "bookw",
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  409: {
    description: "Command conflicts with current device state.",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        examples: {
          conflict: {
            summary: "Device already in requested state",
            value: {
              error: "Device AA11BB22CC33 is already in state booked",
              details: {
                code: ERROR_CODES.DEVICE_ALREADY_IN_STATE,
                deviceId: "AA11BB22CC33",
                currentState: "booked",
                requestedState: "booked",
              },
            },
          },
        },
      },
    },
  },
  500: {
    description: "Infrastructure or system error occurred.",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
        examples: {
          infrastructureError: {
            summary: "MQTT connection failure (production)",
            value: {
              error: "A system error occurred. Please try again later.",
              details: {
                code: "INFRASTRUCTURE_ERROR",
              },
            },
          },
          infrastructureErrorDev: {
            summary: "MQTT connection failure (development)",
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
