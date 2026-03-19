import { submitAgencyRequestRoute } from "./mutations";

export * from "./mutations";

export const agencyRequestsRoutes = {
  submit: submitAgencyRequestRoute,
} as const;
