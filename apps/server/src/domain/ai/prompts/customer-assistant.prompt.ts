import { formatVietnamDateTime, VIETNAM_TIME_ZONE } from "@/domain/shared/business-hours";

import {
  customerAssistantBoundaryRules,
  customerAssistantLanguageAndFormattingRules,
  customerAssistantRentalRules,
  customerAssistantReservationRules,
  customerAssistantRoleRules,
  customerAssistantStationAndBikeRules,
  customerAssistantToolRules,
} from "./customer-assistant.prompt.sections";

function getCurrentDateTimeRule(now: Date) {
  return `Current server time for this request: UTC ${now.toISOString()}. Current local time for MeBike operations (${VIETNAM_TIME_ZONE}): ${formatVietnamDateTime(now)}. Use ${VIETNAM_TIME_ZONE} when interpreting relative time phrases such as today, tonight, tomorrow, this morning, this afternoon, or this evening. Do not guess the current date or time.`;
}

export function buildCustomerAssistantPrompt(now: Date) {

  return [
    ...customerAssistantRoleRules,
    ...customerAssistantToolRules,
    getCurrentDateTimeRule(now),
    ...customerAssistantRentalRules,
    ...customerAssistantReservationRules,
    ...customerAssistantStationAndBikeRules,
    ...customerAssistantLanguageAndFormattingRules,
    ...customerAssistantBoundaryRules,
  ].filter(Boolean).join(" ");
}
