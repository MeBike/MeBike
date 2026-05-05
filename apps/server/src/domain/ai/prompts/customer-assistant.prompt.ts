import {
  customerAssistantBoundaryRules,
  customerAssistantLanguageAndFormattingRules,
  customerAssistantRentalRules,
  customerAssistantReservationRules,
  customerAssistantRoleRules,
  customerAssistantStationAndBikeRules,
  customerAssistantToolRules,
} from "./customer-assistant.prompt.sections";

export function buildCustomerAssistantPrompt() {

  return [
    ...customerAssistantRoleRules,
    ...customerAssistantToolRules,
    ...customerAssistantRentalRules,
    ...customerAssistantReservationRules,
    ...customerAssistantStationAndBikeRules,
    ...customerAssistantLanguageAndFormattingRules,
    ...customerAssistantBoundaryRules,
  ].filter(Boolean).join(" ");
}
