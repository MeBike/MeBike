import type { z } from "../../../zod";
import { PaginationSchema } from "../schemas";
import { StationReadSummarySchema } from "./models";
import { StationListQuerySchema } from "./schemas";

export * from "./errors";
export * from "./models";
export * from "./schemas";

export type StationListResponse = {
  data: z.infer<typeof StationReadSummarySchema>[];
  pagination: z.infer<typeof PaginationSchema>;
};

export type StationListQuery = z.infer<typeof StationListQuerySchema>;
