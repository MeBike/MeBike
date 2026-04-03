import {
  cancelReservationRoute,
  confirmReservationRoute,
  reserveBikeRoute,
} from "./mutations";
import {
  adminGetReservationRoute,
  adminListReservationsRoute,
  getReservationStatsSummaryRoute,
  getMyReservationRoute,
  listMyReservationsRoute,
  staffGetReservationRoute,
  staffListReservationsRoute,
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
  getReservationStatsSummary: getReservationStatsSummaryRoute,
  staffListReservations: staffListReservationsRoute,
  staffGetReservation: staffGetReservationRoute,
} as const;
