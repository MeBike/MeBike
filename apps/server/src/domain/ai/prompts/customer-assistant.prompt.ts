import type { AiChatContext } from "@mebike/shared";

import {
  customerAssistantBoundaryRules,
  customerAssistantLanguageAndFormattingRules,
  customerAssistantRentalRules,
  customerAssistantReservationRules,
  customerAssistantRoleRules,
  customerAssistantStationAndBikeRules,
  customerAssistantToolRules,
} from "./customer-assistant.prompt.sections";

export function buildCustomerAssistantPrompt(context: AiChatContext | null) {
  const screenHint = context?.screen
    ? `Current screen focus: ${context.screen}.`
    : null;
  const stationHint = context?.stationName
    ? `Current station in focus: ${context.stationName}.`
    : null;

  return [
    ...customerAssistantRoleRules,
    ...customerAssistantToolRules,
    ...customerAssistantRentalRules,
    ...customerAssistantReservationRules,
    ...customerAssistantStationAndBikeRules,
    ...customerAssistantLanguageAndFormattingRules,
    ...customerAssistantBoundaryRules,
    screenHint,
    stationHint,
  ].filter(Boolean).join(" ");
}
