import { NfcCardsContracts } from "@mebike/shared";

export type NfcCardsRoutes = typeof import("@mebike/shared")["serverRoutes"]["nfcCards"];

export const {
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
} = NfcCardsContracts;

export type NfcCard = NfcCardsContracts.NfcCard;
export type NfcCardListResponse = NfcCardsContracts.NfcCardListResponse;
export type NfcCardErrorResponse = NfcCardsContracts.NfcCardErrorResponse;
