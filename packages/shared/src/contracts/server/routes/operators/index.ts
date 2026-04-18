import { getOperatorStationContextRoute } from "./queries";

export { getOperatorStationContextRoute as stationContext } from "./queries";

export const operatorsRoutes = {
  stationContext: getOperatorStationContextRoute,
} as const;
