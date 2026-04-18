import type { InferUITools, UIMessage } from "ai";

import { z } from "zod";

import type { CustomerToolSet } from "../tools/customer-tools";

import {
  CurrentRentalSummaryToolOutputSchema,
  ReservationSummaryToolOutputSchema,
  WalletSummaryToolOutputSchema,
} from "../tools/customer-tool-schemas";

export const CustomerAssistantMessageMetadataSchema = z.object({
  timestamp: z.string().datetime().optional(),
  locale: z.string().min(2).max(35).optional(),
}).strict();

export const customerAssistantDataSchemas = {
  rentalSummary: CurrentRentalSummaryToolOutputSchema,
  reservationSummary: ReservationSummaryToolOutputSchema,
  walletSummary: WalletSummaryToolOutputSchema,
} as const;

export type CustomerAssistantMessageMetadata = z.infer<
  typeof CustomerAssistantMessageMetadataSchema
>;

export type CustomerAssistantDataParts = {
  readonly rentalSummary: z.infer<typeof CurrentRentalSummaryToolOutputSchema>;
  readonly reservationSummary: z.infer<typeof ReservationSummaryToolOutputSchema>;
  readonly walletSummary: z.infer<typeof WalletSummaryToolOutputSchema>;
};

export type CustomerAssistantUITools = InferUITools<CustomerToolSet>;

export type CustomerAssistantUIMessage = UIMessage<
  CustomerAssistantMessageMetadata,
  CustomerAssistantDataParts,
  CustomerAssistantUITools
>;

function formatDataPartForModel(label: string, data: unknown) {
  return {
    type: "text" as const,
    text: `${label}: ${JSON.stringify(data)}`,
  };
}

type GenericDataPart = {
  readonly type: `data-${string}`;
  readonly id?: string;
  readonly data: unknown;
};

export function convertCustomerAssistantDataPart(part: GenericDataPart) {
  switch (part.type) {
    case "data-rentalSummary": {
      const parsed = CurrentRentalSummaryToolOutputSchema.safeParse(part.data);
      return parsed.success
        ? formatDataPartForModel("Rental summary", parsed.data)
        : undefined;
    }
    case "data-reservationSummary": {
      const parsed = ReservationSummaryToolOutputSchema.safeParse(part.data);
      return parsed.success
        ? formatDataPartForModel("Reservation summary", parsed.data)
        : undefined;
    }
    case "data-walletSummary": {
      const parsed = WalletSummaryToolOutputSchema.safeParse(part.data);
      return parsed.success
        ? formatDataPartForModel("Wallet summary", parsed.data)
        : undefined;
    }
    default:
      return undefined;
  }
}
