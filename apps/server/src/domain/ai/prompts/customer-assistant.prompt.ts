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

  return [
    ...customerAssistantRoleRules,
    ...customerAssistantToolRules,
    ...customerAssistantRentalRules,
    ...customerAssistantReservationRules,
    ...customerAssistantStationAndBikeRules,
    ...customerAssistantLanguageAndFormattingRules,
    ...customerAssistantBoundaryRules,
    screenHint,
  ].filter(Boolean).join(" ");
}
