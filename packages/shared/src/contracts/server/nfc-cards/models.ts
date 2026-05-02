import { z } from "../../../zod";
import { AccountStatusSchema, VerifyStatusSchema } from "../users";

export const NfcCardStatusSchema = z.enum([
  "UNASSIGNED",
  "ACTIVE",
  "BLOCKED",
  "LOST",
]).openapi("NfcCardStatus");

export const NfcCardAssignedUserSchema = z.object({
  id: z.uuidv7(),
  fullname: z.string(),
  email: z.string().email(),
  account_status: AccountStatusSchema,
  verify_status: VerifyStatusSchema,
}).openapi("NfcCardAssignedUser", {
  example: {
    id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
    fullname: "Nguyen Van A",
    email: "nguyen.van.a@example.com",
    account_status: "ACTIVE",
    verify_status: "VERIFIED",
  },
});

export const NfcCardSchema = z.object({
  id: z.uuidv7(),
  uid: z.string().min(1).openapi({
    description: "Decimal NFC UID string emitted by firmware tap events.",
    example: "123456789",
  }),
  status: NfcCardStatusSchema,
  assigned_user_id: z.uuidv7().nullable(),
  assigned_user: NfcCardAssignedUserSchema.nullable(),
  issued_at: z.string().datetime().nullable(),
  returned_at: z.string().datetime().nullable(),
  blocked_at: z.string().datetime().nullable(),
  lost_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).openapi("NfcCard", {
  example: {
    id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2212",
    uid: "123456789",
    status: "ACTIVE",
    assigned_user_id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
    assigned_user: {
      id: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
      fullname: "Nguyen Van A",
      email: "nguyen.van.a@example.com",
      account_status: "ACTIVE",
      verify_status: "VERIFIED",
    },
    issued_at: "2026-05-02T12:00:00.000Z",
    returned_at: null,
    blocked_at: null,
    lost_at: null,
    created_at: "2026-05-02T12:00:00.000Z",
    updated_at: "2026-05-02T12:00:00.000Z",
  },
});

export const NfcCardListResponseSchema = z.object({
  data: z.array(NfcCardSchema),
}).openapi("NfcCardListResponse");

export type NfcCard = z.infer<typeof NfcCardSchema>;
export type NfcCardAssignedUser = z.infer<typeof NfcCardAssignedUserSchema>;
export type NfcCardListResponse = z.infer<typeof NfcCardListResponseSchema>;
