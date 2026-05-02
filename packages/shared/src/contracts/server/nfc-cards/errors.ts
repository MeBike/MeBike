import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const NfcCardErrorCodeSchema = z.enum([
  "DUPLICATE_NFC_CARD_UID",
  "NFC_CARD_ALREADY_ASSIGNED",
  "NFC_CARD_ASSIGNEE_NOT_FOUND",
  "NFC_CARD_INVALID_STATE",
  "NFC_CARD_NOT_FOUND",
  "NFC_CARD_USER_NOT_ELIGIBLE",
  "USER_ALREADY_HAS_NFC_CARD",
  "VALIDATION_ERROR",
]);

export const nfcCardErrorMessages = {
  DUPLICATE_NFC_CARD_UID: "NFC card UID already exists",
  NFC_CARD_ALREADY_ASSIGNED: "NFC card already assigned to another user",
  NFC_CARD_ASSIGNEE_NOT_FOUND: "Target user not found",
  NFC_CARD_INVALID_STATE: "NFC card state does not allow this operation",
  NFC_CARD_NOT_FOUND: "NFC card not found",
  NFC_CARD_USER_NOT_ELIGIBLE: "Target user is not eligible for NFC access",
  USER_ALREADY_HAS_NFC_CARD: "User already has another NFC card assigned",
  VALIDATION_ERROR: "Invalid request payload",
} as const satisfies Record<z.infer<typeof NfcCardErrorCodeSchema>, string>;

export const NfcCardErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: NfcCardErrorCodeSchema,
  nfcCardId: z.uuidv7().optional(),
  uid: z.string().optional(),
  userId: z.uuidv7().optional(),
  assignedUserId: z.uuidv7().optional(),
  reason: z.enum(["UNVERIFIED", "BANNED"]).optional(),
  status: z.enum(["UNASSIGNED", "ACTIVE", "BLOCKED", "LOST"]).optional(),
});

export const NfcCardErrorResponseSchema = z.object({
  error: z.string(),
  details: NfcCardErrorDetailSchema,
});

export type NfcCardErrorResponse = z.infer<typeof NfcCardErrorResponseSchema>;
