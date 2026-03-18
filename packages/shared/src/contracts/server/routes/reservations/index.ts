import {
  cancelReservationRoute,
  confirmReservationRoute,
  reserveBikeRoute,
} from "./mutations";
import {
  adminGetReservationRoute,
  adminListReservationsRoute,
  getMyReservationRoute,
  listMyReservationsRoute,
} from "./queries";

export * from "../../reservations";
export * from "./mutations";
export * from "./queries";

export const reservationsRoutes = {
  reserveBike: reserveBikeRoute,
  confirmReservation: confirmReservationRoute,
  cancelReservation: cancelReservationRoute,
  listMyReservations: listMyReservationsRoute,
  getMyReservation: getMyReservationRoute,
  adminListReservations: adminListReservationsRoute,
  adminGetReservation: adminGetReservationRoute,
} as const;
