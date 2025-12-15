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
  location: z.string(),
  username: z.string(),
  phoneNumber: z.string(),
  avatar: z.string(),
  role: UserRoleSchema,
  nfcCardUid: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
