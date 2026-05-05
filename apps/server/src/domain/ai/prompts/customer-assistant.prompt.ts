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

function getLiveLocationAvailabilityRule(locationAvailable: boolean) {
  return locationAvailable
    ? "Live location is available for this request. If the user asks for the nearest station, stations close to them, or asks you to find a nearby station for them, prefer the live-location nearby-station tool instead of answering from general knowledge or saying location is unavailable."
    : "Live location is not available for this request. Do not imply that you know the user's exact current position.";
}

function getLocationLabelRule(locationLabel: string | null) {
  if (!locationLabel) {
    return null;
  }

  return `Approximate current area for this request: ${locationLabel}. Use this only as a coarse place hint for natural wording or to explain nearby results after you check them with tools. Do not treat this label as the exact address, and do not use it as a substitute for the live-location nearby-station tool when the user asks what is near them.`;
}

function getCurrentDateTimeRule(now: Date) {
  return `Current server time for this request: UTC ${now.toISOString()}. Current local time for MeBike operations (${VIETNAM_TIME_ZONE}): ${formatVietnamDateTime(now)}. Use ${VIETNAM_TIME_ZONE} when interpreting relative time phrases such as today, tonight, tomorrow, this morning, this afternoon, or this evening. Do not guess the current date or time.`;
}

export function buildCustomerAssistantPrompt(
  locationAvailable: boolean,
  locationLabel: string | null,
  now: Date,
) {
  return [
    ...customerAssistantRoleRules,
    ...customerAssistantToolRules,
    getCurrentDateTimeRule(now),
    getLiveLocationAvailabilityRule(locationAvailable),
    getLocationLabelRule(locationLabel),
    ...customerAssistantRentalRules,
    ...customerAssistantReservationRules,
    ...customerAssistantStationAndBikeRules,
    ...customerAssistantLanguageAndFormattingRules,
    ...customerAssistantBoundaryRules,
  ].filter(Boolean).join(" ");
}
