import { z } from "zod";

export const InvalidStateTransitionSchema = z.object({
  code: z.literal("INVALID_STATE_TRANSITION"),
  message: z.string(),
  details: z.object({
    currentState: z.string(),
    requestedState: z.string(),
    allowedStates: z.array(z.string()),
    reason: z.string(),
  }),
});

export const DeviceNotFoundSchema = z.object({
  code: z.literal("DEVICE_NOT_FOUND"),
  message: z.string(),
  details: z.object({
    deviceId: z.string(),
  }),
});

export const DeviceAlreadyInStateSchema = z.object({
  code: z.literal("DEVICE_ALREADY_IN_STATE"),
  message: z.string(),
  details: z.object({
    deviceId: z.string(),
    currentState: z.string(),
    requestedState: z.string(),
  }),
});

export const ReservationNotFoundSchema = z.object({
  code: z.literal("RESERVATION_NOT_FOUND"),
  message: z.string(),
  details: z.object({
    deviceId: z.string(),
    reservationId: z.string().optional(),
  }),
});

export const MaintenanceRequiredSchema = z.object({
  code: z.literal("MAINTENANCE_REQUIRED"),
  message: z.string(),
  details: z.object({
    deviceId: z.string(),
    currentState: z.string(),
    issue: z.string(),
  }),
});

export const BusinessLogicErrorSchema = z.union([
  InvalidStateTransitionSchema,
  DeviceNotFoundSchema,
  DeviceAlreadyInStateSchema,
  ReservationNotFoundSchema,
  MaintenanceRequiredSchema,
]);
export type InvalidStateTransition = z.infer<typeof InvalidStateTransitionSchema>;
export type DeviceNotFound = z.infer<typeof DeviceNotFoundSchema>;
export type DeviceAlreadyInState = z.infer<typeof DeviceAlreadyInStateSchema>;
export type ReservationNotFound = z.infer<typeof ReservationNotFoundSchema>;
export type MaintenanceRequired = z.infer<typeof MaintenanceRequiredSchema>;
export type BusinessLogicError = z.infer<typeof BusinessLogicErrorSchema>;

export const ERROR_CODES = {
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  DEVICE_NOT_FOUND: "DEVICE_NOT_FOUND",
  DEVICE_ALREADY_IN_STATE: "DEVICE_ALREADY_IN_STATE",
  RESERVATION_NOT_FOUND: "RESERVATION_NOT_FOUND",
  MAINTENANCE_REQUIRED: "MAINTENANCE_REQUIRED",
} as const;

export const STATE_TRANSITION_RULES = {
  reserved: {
    allowed: ["available", "booked"],
    reasons: {
      available: "Reservation cancelled",
      booked: "User picked up the bike",
    },
  },
  booked: {
    allowed: ["available", "broken", "maintained", "unavailable"],
    reasons: {
      available: "Bike returned by user",
      broken: "Issue reported or detected during use",
      maintained: "Maintenance scheduled during use",
      unavailable: "Bike marked unavailable during use",
    },
  },
  broken: {
    allowed: ["maintained", "unavailable"],
    reasons: {
      maintained: "Maintenance started on broken bike",
      unavailable: "Bike permanently unavailable",
    },
  },
  maintained: {
    allowed: ["available", "unavailable"],
    reasons: {
      available: "Maintenance completed successfully",
      unavailable: "Bike deemed permanently unavailable after maintenance",
    },
  },
  available: {
    allowed: ["reserved", "booked", "broken", "maintained", "unavailable"],
    reasons: {
      reserved: "Bike reserved by user",
      booked: "Bike rented directly",
      broken: "Issue detected when available",
      maintained: "Scheduled maintenance",
      unavailable: "Bike taken offline",
    },
  },
  unavailable: {
    allowed: ["available", "maintained"],
    reasons: {
      available: "Bike brought back online",
      maintained: "Maintenance started on unavailable bike",
    },
  },
} as const;

export function validateStateTransition(
  currentState: string,
  requestedState: string,
): { valid: true } | { valid: false; error: InvalidStateTransition } {
  const rules = (STATE_TRANSITION_RULES as any)[currentState];

  if (!rules) {
    return {
      valid: false,
      error: {
        code: "INVALID_STATE_TRANSITION",
        message: `Unknown current state: ${currentState}`,
        details: {
          currentState,
          requestedState,
          allowedStates: [],
          reason: "Current state is not recognized",
        },
      },
    };
  }

  const allowedStates = rules.allowed as readonly string[];
  if (!allowedStates.includes(requestedState)) {
    return {
      valid: false,
      error: {
        code: "INVALID_STATE_TRANSITION",
        message: `Cannot transition from ${currentState} to ${requestedState}`,
        details: {
          currentState,
          requestedState,
          allowedStates: [...rules.allowed],
          reason: rules.reasons[requestedState as keyof typeof rules.reasons] || "Transition not allowed",
        },
      },
    };
  }

  return { valid: true };
}

export function createBusinessLogicError(error: BusinessLogicError) {
  return {
    code: error.code,
    ...error.details,
  };
}
