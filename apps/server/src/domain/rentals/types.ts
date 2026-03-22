import type { PageRequest } from "@/domain/shared/pagination";

import type { ConfirmationMethod, RentalStatus } from "../../../generated/prisma/enums";
import type { MyRentalFilter, RentalSortField } from "./models";

export type ListMyRentalsInput = {
  userId: string;
  filter: MyRentalFilter;
  pageReq: PageRequest<RentalSortField>;
};

export type StartRentalInput = {
  userId: string;
  bikeId: string;
  startStationId: string;
  startTime: Date;
  subscriptionId?: string;
};

export type EndRentalInput = {
  userId: string;
  rentalId: string;
  endStationId: string;
  endTime: Date;
  nextStatus?: RentalStatus; // optional override if needed later
};

export type ConfirmRentalReturnInput = {
  rentalId: string;
  stationId: string;
  confirmedByUserId: string;
  confirmationMethod: ConfirmationMethod;
  confirmedAt: Date;
};
