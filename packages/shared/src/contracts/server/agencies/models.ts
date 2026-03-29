import { z } from "../../../zod";

import { AccountStatusSchema } from "../users";

export const AgencySummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string().nullable(),
  contactPhone: z.string().nullable(),
  status: AccountStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencySummary");

export type AgencySummary = z.infer<typeof AgencySummarySchema>;
