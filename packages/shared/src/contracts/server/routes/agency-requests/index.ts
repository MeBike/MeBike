import {
  approveAgencyRequestRoute,
  cancelAgencyRequestRoute,
  rejectAgencyRequestRoute,
  submitAgencyRequestRoute,
} from "./mutations";
import {
  adminGetAgencyRequestRoute,
  adminListAgencyRequestsRoute,
  getMyAgencyRequestRoute,
  listMyAgencyRequestsRoute,
} from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const agencyRequestsRoutes = {
  submit: submitAgencyRequestRoute,
  listMine: listMyAgencyRequestsRoute,
  getMine: getMyAgencyRequestRoute,
  cancel: cancelAgencyRequestRoute,
  adminApprove: approveAgencyRequestRoute,
  adminReject: rejectAgencyRequestRoute,
  adminList: adminListAgencyRequestsRoute,
  adminGet: adminGetAgencyRequestRoute,
} as const;
