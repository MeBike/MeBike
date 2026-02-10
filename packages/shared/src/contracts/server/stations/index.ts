import type { z } from "../../../zod";

import { StationListResponseSchema } from "../routes/stations/shared";

export * from "./errors";
export * from "./models";
export * from "./schemas";

export { StationListResponseSchema };
export type StationListResponse = z.infer<typeof StationListResponseSchema>;
