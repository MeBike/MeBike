import { z } from "../../../../zod";
import {
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
  NfcCardErrorResponseSchema,
  NfcCardListResponseSchema,
  NfcCardSchema,
  NfcCardStatusSchema,
} from "../../nfc-cards";
import {
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";

export {
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
  NfcCardErrorResponseSchema,
  NfcCardListResponseSchema,
  NfcCardSchema,
  NfcCardStatusSchema,
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
};

export const NfcCardIdParamSchema = z.object({
  nfcCardId: z.uuidv7(),
}).openapi("NfcCardIdParam");

export const ListNfcCardsQuerySchema = z.object({
  status: NfcCardStatusSchema.optional(),
  assignedUserId: z.uuidv7().optional(),
  uid: z.string().min(1).optional(),
}).openapi("ListNfcCardsQuery");

export const CreateNfcCardBodySchema = z.object({
  uid: z.string().trim().min(1).openapi({
    description: "Decimal NFC UID string read by PN532 firmware and sent as cardUid in MQTT tap events.",
    example: "123456789",
  }),
}).openapi("CreateNfcCardBody");

export const AssignNfcCardBodySchema = z.object({
  userId: z.uuidv7(),
}).openapi("AssignNfcCardBody", {
  example: {
    userId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
  },
});

export const UpdateNfcCardStatusBodySchema = z.object({
  status: NfcCardStatusSchema,
}).openapi("UpdateNfcCardStatusBody", {
  example: {
    status: "BLOCKED",
  },
});

export type ListNfcCardsQuery = z.infer<typeof ListNfcCardsQuerySchema>;
