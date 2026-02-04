import type { UserDetail } from "@services/users/user-service";

import React from "react";

import type { Rental } from "@/types/rental-types";

import InfoCard from "../components/InfoCard";
import InfoRow from "../components/InfoRow";

export function RentalUserInfoCard({
  rental,
  currentUser,
}: {
  rental: Rental;
  currentUser?: UserDetail;
}) {
  return (
    <InfoCard title="Thông tin người dùng" icon="person">
      <InfoRow label="Họ tên:" value={currentUser?.fullname ?? ""} />
      <InfoRow label="Email:" value={currentUser?.email ?? ""} />
      <InfoRow label="Số điện thoại:" value={currentUser?.phoneNumber ?? ""} />
      <InfoRow label="UserId:" value={rental.userId} />
    </InfoCard>
  );
}
