import {
  requestStatusCommandRoute,
  sendBookingCommandRoute,
  sendMaintenanceCommandRoute,
  sendReservationCommandRoute,
  sendStateCommandRoute,
} from "./commands";
import { getDeviceRoute, listDevicesRoute } from "./devices";
import { healthRoute } from "./health";

export * from "./commands";
export * from "./devices";
export * from "./health";

export const iotServiceRoutes = {
  health: healthRoute,
  listDevices: listDevicesRoute,
  getDevice: getDeviceRoute,
  sendStateCommand: sendStateCommandRoute,
  sendBookingCommand: sendBookingCommandRoute,
  sendMaintenanceCommand: sendMaintenanceCommandRoute,
  sendReservationCommand: sendReservationCommandRoute,
  requestStatusCommand: requestStatusCommandRoute,
} as const;

export type IotServiceRouteKey = keyof typeof iotServiceRoutes;
