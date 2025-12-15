import { z } from "../../../zod";

export const UserRoleSchema = z.enum(["USER", "STAFF", "ADMIN", "SOS"]);

export const VerifyStatusSchema = z.enum(["UNVERIFIED", "VERIFIED", "BANNED"]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type VerifyStatus = z.infer<typeof VerifyStatusSchema>;
