import { IOT_PUBLISH_TOPICS } from "@mebike/shared";

import { handleBookingStatusMessage } from "./booking";
import { handleLogMessage } from "./logs";
import { handleMaintenanceStatusMessage } from "./maintenance";
import { handleCardTapMessage } from "./rentals";
import { handleStatusMessage } from "./status";

export const messageHandlers = {
  [IOT_PUBLISH_TOPICS.status]: handleStatusMessage,
  [IOT_PUBLISH_TOPICS.logs]: handleLogMessage,
  [IOT_PUBLISH_TOPICS.bookingStatus]: handleBookingStatusMessage,
  [IOT_PUBLISH_TOPICS.maintenanceStatus]: handleMaintenanceStatusMessage,
  [IOT_PUBLISH_TOPICS.cardTap]: handleCardTapMessage,
} as const;

export type MessageHandler = (topic: string, payload: string) => void | Promise<void>;
