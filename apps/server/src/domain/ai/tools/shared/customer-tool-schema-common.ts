import { z } from "zod";

export const StationSummaryInfoSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
}).strict();

export const ActionFailureKindSchema = z.enum([
  "validation",
  "business",
  "temporary",
]);
