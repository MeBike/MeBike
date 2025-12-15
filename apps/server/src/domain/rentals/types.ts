import type { PageRequest } from "@/domain/shared/pagination";

import type { RentalStatus } from "../../../generated/prisma/enums";
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
};

export type EndRentalInput = {
  userId: string;
  rentalId: string;
  endStationId: string;
  endTime: Date;
  nextStatus?: RentalStatus; // optional override if needed later
};
