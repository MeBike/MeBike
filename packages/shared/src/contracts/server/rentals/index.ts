import type { z } from "../../../zod";
import type {
  RentalCountsResponseSchema,
} from "../routes/rentals/shared";

import {
  MyRentalListResponseSchema,
  RentalListResponseSchema,
} from "../routes/rentals/shared";

export * from "./errors";
export * from "./models";
export * from "./schemas";

export type RentalListResponse = z.infer<typeof RentalListResponseSchema>;
export type MyRentalListResponse = z.infer<typeof MyRentalListResponseSchema>;
export type RentalCountsResponse = z.infer<typeof RentalCountsResponseSchema>;

// Re-export selected route schemas/types for convenience
export {
  MyRentalListResponseSchema,
  RentalListResponseSchema,
};
