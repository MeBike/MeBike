import { z } from "../../../../zod";
import {
  ReservationErrorCodeSchema,
  ReservationErrorResponseSchema,
} from "../../reservations";

export { ReservationErrorResponseSchema };

export const ReservationIdParamSchema = z
  .object({
    reservationId: z.uuidv7().openapi({
      example: "019b17bd-d130-7e7d-be69-91ceef7b6959",
      description: "Reservation identifier",
    }),
  })
  .openapi("ReservationIdParam", {
    description: "Path params for reservation id",
  });

export { ReservationErrorCodeSchema };
