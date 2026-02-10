import React from "react";

import InfoCard from "../components/InfoCard";
import InfoRow from "../components/InfoRow";

import type { RentalDetail } from "@/types/rental-types";

export function AdminUserInfoCard({ booking }: { booking: RentalDetail }) {
  const user = booking.user;
  return (
    <InfoCard title="Thông tin người dùng" icon="person">
      <InfoRow label="Họ tên:" value={user.fullname} />
      <InfoRow label="Username:" value={user.username || ""} />
      <InfoRow label="Email:" value={user.email} />
      <InfoRow label="Số điện thoại:" value={user.phoneNumber} />
      <InfoRow label="Địa chỉ:" value={user.location} />
      <InfoRow label="Trạng thái xác thực:" value={user.verify} />
      <InfoRow label="Role:" value={user.role} />
    </InfoCard>
  );
}
