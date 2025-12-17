import { z } from "../../../zod";
import { UserRoleSchema, VerifyStatusSchema } from "./schemas";

export const UserSummarySchema = z.object({
  id: z.string(),
  fullname: z.string(),
});

export const UserDetailSchema = z.object({
  id: z.string(),
  fullname: z.string(),
  email: z.string(),
  verify: VerifyStatusSchema,
  location: z.string().nullable(),
  username: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  avatar: z.string().nullable(),
  role: UserRoleSchema,
  nfcCardUid: z.string().nullable(),
  updatedAt: z.string(),
});

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
