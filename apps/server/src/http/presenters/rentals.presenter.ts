import type { RentalsContracts } from "@mebike/shared";

import type {
  AdminRentalDetail,
  AdminRentalListItem,
  BikeSwapRequestRow,
  RentalBillingPreviewRow,
  RentalRow,
  ReturnSlotRow,
  StaffBikeSwapRequestRow,
} from "@/domain/rentals";

function toContractRentalDeposit(row: RentalRow) {
  return {
    depositAmount: row.depositAmount ?? undefined,
    depositStatus: row.depositStatus,
    depositHeldAt: row.depositHeldAt?.toISOString(),
    depositReleasedAt: row.depositReleasedAt?.toISOString() ?? undefined,
    depositForfeitedAt: row.depositForfeitedAt?.toISOString() ?? undefined,
  } as const;
}

export function toContractRental(
  row: RentalRow,
): RentalsContracts.MyRentalListResponse["data"][number] {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId,
    bikeNumber: row.bikeNumber ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? undefined,
    subscriptionId: row.subscriptionId ?? undefined,
    ...toContractRentalDeposit(row),
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractRentalWithPrice(
  row: RentalRow,
): RentalsContracts.RentalWithPrice {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId,
    bikeNumber: row.bikeNumber ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? 0,
    subscriptionId: row.subscriptionId ?? undefined,
    ...toContractRentalDeposit(row),
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractRentalBillingPreview(
  row: RentalBillingPreviewRow,
): RentalsContracts.RentalBillingPreview {
  return {
    rentalId: row.rentalId,
    previewedAt: row.previewedAt.toISOString(),
    pricingPolicyId: row.pricingPolicyId,
    rentalMinutes: row.rentalMinutes,
    billableBlocks: row.billableBlocks,
    billableHours: row.billableHours,
    baseRentalAmount: row.baseRentalAmount,
    prepaidAmount: row.prepaidAmount,
    eligibleRentalAmount: row.eligibleRentalAmount,
    subscriptionApplied: row.subscriptionApplied,
    subscriptionDiscountAmount: row.subscriptionDiscountAmount,
    bestDiscountRule: row.bestDiscountRule
      ? {
          ruleId: row.bestDiscountRule.ruleId,
          name: row.bestDiscountRule.name,
          triggerType: row.bestDiscountRule.triggerType,
          minRidingMinutes: row.bestDiscountRule.minRidingMinutes,
          discountType: row.bestDiscountRule.discountType,
          discountValue: row.bestDiscountRule.discountValue,
        }
      : null,
    couponDiscountAmount: row.couponDiscountAmount,
    penaltyAmount: row.penaltyAmount,
    depositForfeited: row.depositForfeited,
    payableRentalAmount: row.payableRentalAmount,
    totalPayableAmount: row.totalPayableAmount,
  };
}

export function toContractAdminRentalListItem(
  item: AdminRentalListItem,
): RentalsContracts.AdminRentalsListResponse["data"][number] {
  return {
    id: item.id,
    user: item.user,
    bikeId: item.bikeId,
    bikeNumber: item.bikeNumber ?? undefined,
    status: item.status,
    startStation: item.startStationId,
    endStation: item.endStationId ?? undefined,
    createdAt: item.createdAt.toISOString(),
    startTime: item.startTime.toISOString(),
    endTime: item.endTime ? item.endTime.toISOString() : undefined,
    duration: item.durationMinutes ?? 0,
    totalPrice: item.totalPrice ?? 0,
    subscriptionId: item.subscriptionId ?? undefined,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toContractRentalListItem(
  item: AdminRentalListItem,
): RentalsContracts.RentalListResponse["data"][number] {
  return {
    id: item.id,
    user: item.user,
    bikeId: item.bikeId,
    bikeNumber: item.bikeNumber ?? undefined,
    status: item.status,
    startStation: item.startStationId,
    endStation: item.endStationId ?? undefined,
    startTime: item.startTime.toISOString(),
    endTime: item.endTime ? item.endTime.toISOString() : undefined,
    duration: item.durationMinutes ?? 0,
    totalPrice: item.totalPrice ?? 0,
    subscriptionId: item.subscriptionId ?? undefined,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toContractAdminRentalDetail(
  detail: AdminRentalDetail,
): RentalsContracts.RentalDetail {
  return {
    id: detail.id,
    user: {
      id: detail.user.id,
      fullname: detail.user.fullname,
      email: detail.user.email,
      verify: detail.user.verify,
      location: detail.user.location,
      username: detail.user.username,
      phoneNumber: detail.user.phoneNumber,
      avatar: detail.user.avatar,
      role: detail.user.role,
      nfcCardUid: detail.user.nfcCardUid ?? undefined,
      updatedAt: detail.user.updatedAt.toISOString(),
    },
    bike: {
      id: detail.bike.id,
      bikeNumber: detail.bike.bikeNumber,
      chipId: detail.bike.chipId,
      status: detail.bike.status,
      supplierId: detail.bike.supplierId ?? undefined,
      updatedAt: detail.bike.updatedAt.toISOString(),
    },
    startStation: {
      id: detail.startStation.id,
      name: detail.startStation.name,
      address: detail.startStation.address,
      latitude: detail.startStation.latitude,
      longitude: detail.startStation.longitude,
      totalCapacity: detail.startStation.totalCapacity,
      updatedAt: detail.startStation.updatedAt.toISOString(),
    },
    endStation: detail.endStation
      ? {
          id: detail.endStation.id,
          name: detail.endStation.name,
          address: detail.endStation.address,
          latitude: detail.endStation.latitude,
          longitude: detail.endStation.longitude,
          totalCapacity: detail.endStation.totalCapacity,
          updatedAt: detail.endStation.updatedAt.toISOString(),
        }
      : null,
    returnSlot: detail.returnSlot
      ? {
          id: detail.returnSlot.id,
          reservedFrom: detail.returnSlot.reservedFrom.toISOString(),
          status: detail.returnSlot.status,
          station: {
            id: detail.returnSlot.station.id,
            name: detail.returnSlot.station.name,
            address: detail.returnSlot.station.address,
          },
        }
      : null,
    startTime: detail.startTime.toISOString(),
    endTime: detail.endTime ? detail.endTime.toISOString() : undefined,
    duration: detail.durationMinutes ?? 0,
    totalPrice: detail.totalPrice ?? 0,
    subscriptionId: detail.subscriptionId ?? undefined,
    status: detail.status,
    updatedAt: detail.updatedAt.toISOString(),
  };
}

export function toContractBikeSwapRequest(
  row: BikeSwapRequestRow,
): RentalsContracts.BikeSwapRequest {
  return {
    id: row.id,
    rentalId: row.rentalId,
    userId: row.userId,
    oldBikeId: row.oldBikeId,
    newBikeId: row.newBikeId,
    stationId: row.stationId,
    reason: row.reason || null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractBikeSwapRequestDetail(
  row: StaffBikeSwapRequestRow,
): RentalsContracts.BikeSwapRequestDetail {
  return {
    id: row.id,
    rentalId: row.rentalId,
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
    },
    oldBike: {
      id: row.oldBike.id,
      bikeNumber: row.oldBike.bikeNumber,
      chipId: row.oldBike.chipId,
      station: {
        id: row.oldBike.station.id,
        name: row.oldBike.station.name,
        address: row.oldBike.station.address,
      },
      supplier: {
        id: row.oldBike.supplier.id,
        name: row.oldBike.supplier.name,
      },
    },
    newBike: row.newBike
      ? {
          id: row.newBike.id,
          bikeNumber: row.newBike.bikeNumber,
          chipId: row.newBike.chipId,
          station: {
            id: row.newBike.station.id,
            name: row.newBike.station.name,
            address: row.newBike.station.address,
          },
          supplier: {
            id: row.newBike.supplier.id,
            name: row.newBike.supplier.name,
          },
        }
      : null,
    station: row.station
      ? {
          id: row.station.id,
          name: row.station.name,
          address: row.station.address,
        }
      : null,
    reason: row.reason || null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractReturnSlot(
  row: ReturnSlotRow,
): RentalsContracts.ReturnSlotReservation {
  return {
    id: row.id,
    rentalId: row.rentalId,
    userId: row.userId,
    stationId: row.stationId,
    reservedFrom: row.reservedFrom.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
